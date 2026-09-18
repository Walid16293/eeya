import asyncio
import json
import os
import sys
from datetime import datetime

# Configuration encodage UTF-8 pour Windows (emojis & caractères arabes)
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import FloodWaitError
from telethon.tl.functions.contacts import SearchRequest
from telethon.tl.functions.channels import GetChannelRecommendationsRequest

# ==========================================
# ⚙️ CONFIGURATION DU SCRAPER TELEGRAM
# ==========================================
API_ID = int(os.getenv("TELEGRAM_API_ID", "37287193"))
API_HASH = os.getenv("TELEGRAM_API_HASH", "4dbdb8a3f87794dbc0da323d223e31be")

# Clé de session Cloud (StringSession)
SESSION_ENV = os.getenv("TELEGRAM_SESSION", "")

# Destination des alertes (Identifiant exact de votre groupe 'Grossistes Alertes' ou 'me')
DESTINATION = os.getenv("TELEGRAM_DESTINATION", "-5044680159")

# Mode exécution unique (GitHub Actions) ou boucle continue (PC local)
RUN_ONCE = os.getenv("RUN_ONCE", "false").lower() in ("true", "1") or os.getenv("GITHUB_ACTIONS") == "true"

# Intervalle de vérification automatique pour le mode local (en minutes)
INTERVALLE_MINUTES = int(os.getenv("INTERVALLE_MINUTES", "60"))

# Fichier pour mémoriser les canaux déjà envoyés (évite les doublons)
FICHIER_HISTORIQUE = "canaux_vus.json"

# Mots-clés ciblés pour grossistes vêtements femmes (Algérie, El Eulma, Ain Fakroun...)
mots_cles = [
    "grossiste algerie",
    "grossiste vetement femme",
    "grossiste el eulma",
    "grossiste ain fakroun",
    "ملابس نساء جملة",
    "سوق العلمة ملابس",
    "عين فكرون ملابس",
    "قنادر بيجامات جملة",
    "عبايات جملة الجزائر",
    "ملابس داخلية نساء جملة",
    "قنادر الدار جملة",
    "بيجامات نسائية جملة"
]

def obtenir_session():
    """Détermine quelle session utiliser (StringSession cloud ou fichier local)."""
    if SESSION_ENV:
        return StringSession(SESSION_ENV)
    if os.path.exists("session_string.txt"):
        with open("session_string.txt", "r", encoding="utf-8") as f:
            contenu = f.read().strip()
            if contenu:
                return StringSession(contenu)
    return "session_recherche"

def charger_historique() -> dict[str, str]:
    """Charge la liste des canaux déjà connus depuis le fichier JSON."""
    if os.path.exists(FICHIER_HISTORIQUE):
        try:
            with open(FICHIER_HISTORIQUE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def sauvegarder_historique(canaux: dict[str, str]):
    """Sauvegarde l'historique complet pour ne jamais renvoyer les mêmes liens."""
    with open(FICHIER_HISTORIQUE, "w", encoding="utf-8") as f:
        json.dump(canaux, f, ensure_ascii=False, indent=2)

async def resoudre_cible(client: TelegramClient, cible):
    """Résout intelligemment l'entité Telegram (par ID, nom de groupe, @username ou 'me')."""
    if cible == "me":
        return "me"
    
    # Si c'est un ID numérique (ex: -5044680159)
    try:
        id_num = int(cible)
        return await client.get_entity(id_num)
    except (ValueError, TypeError):
        pass

    # Si c'est un @username
    if str(cible).startswith("@"):
        return await client.get_entity(cible)

    # Si c'est le nom exact du groupe (ex: 'Grossistes Alertes'), on recherche dans les dialogues
    async for dialog in client.iter_dialogs():
        if dialog.name == cible:
            return dialog.entity

    # Dernier recours : tentative directe get_entity
    return await client.get_entity(cible)

async def envoyer_alerte_telegram(client: TelegramClient, nouveaux_canaux: dict[str, str]):
    """Envoie les nouveaux canaux détectés vers la destination choisie en découpant les messages."""
    total = len(nouveaux_canaux)
    items = list(nouveaux_canaux.items())
    chunk_size = 15  # Pour respecter la limite de taille des messages Telegram

    try:
        dest_entity = await resoudre_cible(client, DESTINATION)
    except Exception as e:
        print(f"⚠️ Impossible de résoudre '{DESTINATION}': {e}. Envoi vers 'me' en secours.")
        dest_entity = "me"

    for i in range(0, total, chunk_size):
        lot = items[i:i + chunk_size]
        lignes = [f"🔔 **Nouveaux canaux Grossistes Vêtements Femmes** ({i + 1}-{i + len(lot)}/{total}) :", ""]
        for idx, (username, titre) in enumerate(lot, i + 1):
            titre_propre = titre.replace("\n", " ").strip()
            lignes.append(f"**{idx}.** [{titre_propre}](https://t.me/{username}) `@{username}`")

        message = "\n".join(lignes)
        try:
            await client.send_message(dest_entity, message, parse_mode="md", link_preview=False)
            await asyncio.sleep(1)
        except Exception as e:
            print(f"❌ Erreur envoi message : {e}")

async def cycle_recherche(client: TelegramClient, canaux_connus: dict[str, str]) -> dict[str, str]:
    """Exécute un cycle complet de recherche et retourne uniquement les canaux jamais vus."""
    canaux_trouves = {}

    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 🔍 Lancement de la recherche globale Telegram...")
    for mot in mots_cles:
        try:
            res = await client(SearchRequest(q=mot, limit=50))
            for chat in res.chats:
                username = getattr(chat, "username", None)
                if username and username.lower() not in canaux_connus:
                    canaux_trouves[username.lower()] = chat.title or username
            await asyncio.sleep(1)
        except FloodWaitError as fwe:
            print(f"⏳ Telegram demande une pause de {fwe.seconds} secondes...")
            await asyncio.sleep(fwe.seconds)
        except Exception as e:
            print(f"Erreur sur '{mot}': {e}")

    # Recommandations en cascade ("Canaux similaires") sur les canaux découverts
    print("🚀 Analyse des canaux similaires en cascade...")
    for username in list(canaux_trouves.keys())[:10]:
        try:
            entite = await client.get_entity(username)
            recommandations = await client(GetChannelRecommendationsRequest(channel=entite))
            for chat in recommandations.chats:
                rec_user = getattr(chat, "username", None)
                if rec_user and rec_user.lower() not in canaux_connus:
                    canaux_trouves[rec_user.lower()] = chat.title or rec_user
            await asyncio.sleep(1)
        except Exception:
            continue

    return canaux_trouves

async def main():
    canaux_connus = charger_historique()
    print(f"📚 {len(canaux_connus)} canaux déjà mémorisés dans {FICHIER_HISTORIQUE}.")

    session = obtenir_session()
    async with TelegramClient(session, API_ID, API_HASH) as client:
        print("✅ Connecté avec succès à Telegram !")
        print(f"🎯 Destination des alertes : '{DESTINATION}'")

        if RUN_ONCE:
            print("⚡ Mode exécution unique (GitHub Actions / Cloud).")
            nouveaux = await cycle_recherche(client, canaux_connus)
            if nouveaux:
                print(f"✨ {len(nouveaux)} NOUVEAUX canaux uniques découverts !")
                await envoyer_alerte_telegram(client, nouveaux)
                canaux_connus.update(nouveaux)
                sauvegarder_historique(canaux_connus)
                print("💾 Historique mis à jour avec succès.")
            else:
                print("ℹ️ Aucun nouveau canal inédit trouvé lors de cette analyse.")
            return

        print(f"⏱️ Mode boucle locale : vérification toutes les {INTERVALLE_MINUTES} minutes.")
        while True:
            try:
                nouveaux = await cycle_recherche(client, canaux_connus)
                if nouveaux:
                    print(f"✨ {len(nouveaux)} NOUVEAUX canaux uniques découverts !")
                    await envoyer_alerte_telegram(client, nouveaux)
                    canaux_connus.update(nouveaux)
                    sauvegarder_historique(canaux_connus)
                    print("💾 Historique mis à jour.")
                else:
                    print("ℹ️ Aucun nouveau canal inédit lors de ce cycle.")

            except FloodWaitError as fwe:
                print(f"⏳ FloodWait: attente de {fwe.seconds} secondes...")
                await asyncio.sleep(fwe.seconds)
            except Exception as e:
                print(f"⚠️ Erreur durant le cycle : {e}")

            print(f"💤 Prochaine analyse dans {INTERVALLE_MINUTES} minutes...\n")
            await asyncio.sleep(INTERVALLE_MINUTES * 60)

if __name__ == "__main__":
    asyncio.run(main())


