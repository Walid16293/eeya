import React from 'react';
import { FlaskConical, Package, TrendingUp, ShieldCheck } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'laboratoire', label: 'Laboratoire', icon: FlaskConical },
    { id: 'produits', label: 'Sel3a', icon: Package },
    { id: 'fayda', label: 'Fayda', icon: TrendingUp },
    { id: 'profil', label: 'Gérants', icon: ShieldCheck },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <div className="nav-icon-wrapper">
              <Icon size={20} />
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
