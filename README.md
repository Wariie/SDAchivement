# 🏆 Achievement Tracker - Plugin Decky Loader

Un plugin pour Steam Deck qui affiche la progression et les achievements de tes jeux directement dans le menu Quick Access !

## ✨ Fonctionnalités

- **📊 Progression en temps réel** : Affiche la progression du jeu actuellement en cours
- **🏆 Tracker d'achievements** : Vue détaillée de tous les achievements avec leur statut
- **📈 Statistiques de jeu** : Temps de jeu, progression histoire, collectibles
- **⭐ Achievements rares** : Met en avant les achievements les plus difficiles
- **🔄 Rafraîchissement automatique** : Mise à jour toutes les 30 secondes
- **📱 Interface intuitive** : Intégration parfaite dans l'interface Steam Deck

## 📦 Installation

### Prérequis

1. **Decky Loader** installé sur ton Steam Deck
   - Si pas encore installé : https://github.com/SteamDeckHomebrew/decky-loader

2. **Mode Développeur** activé dans Decky Loader

### Structure du projet

```
achievement-tracker/
├── src/
│   └── index.tsx          # Frontend React/TypeScript
├── main.py                # Backend Python
├── plugin.json            # Configuration du plugin
├── package.json           # Dépendances Node.js
├── rollup.config.js       # Configuration build
└── README.md
```

### Installation étape par étape

1. **Clone ou télécharge le projet**
```bash
git clone https://github.com/ton-username/achievement-tracker.git
cd achievement-tracker
```

2. **Installe les dépendances**
```bash
# Frontend
npm install
# ou
pnpm install
```

3. **Build le frontend**
```bash
npm run build
```

4. **Copie le plugin sur ton Steam Deck**
```bash
# Via SSH (remplace deck@steamdeck par ton IP)
scp -r achievement-tracker/ deck@steamdeck:~/homebrew/plugins/
```

5. **Redémarre Decky Loader**
   - Va dans les paramètres Decky
   - Clique sur "Reload Plugins"

## 🚀 Utilisation

1. **Lance un jeu** sur ton Steam Deck
2. **Ouvre le Quick Access Menu** (bouton ...)
3. **Sélectionne l'icône Trophy** (Achievement Tracker)
4. **Explore tes achievements** et ta progression !

### Fonctionnalités principales

- **Jeu Actuel** : Affiche automatiquement le jeu en cours
- **Barre de progression** : Visualise ton avancement global
- **Liste d'achievements** : 
  - 🏆 Doré = Débloqué
  - Gris = Verrouillé
  - ⭐ = Achievement rare (<5% des joueurs)
- **Détails au clic** : Clique sur un achievement pour plus d'infos
- **Filtre rares** : Active pour voir uniquement les achievements rares
- **Rafraîchissement** : Force la mise à jour des données

## 🔧 Configuration avancée

### Personnalisation du backend

Le fichier `main.py` peut être modifié pour :
- Ajouter l'intégration avec l'API Steam Web
- Implémenter un cache persistant
- Ajouter des notifications d'achievements

### API Steam Web (optionnel)

Pour des données plus complètes, configure l'API Steam :

1. Obtiens une clé API : https://steamcommunity.com/dev/apikey
2. Ajoute-la dans `main.py` :
```python
STEAM_API_KEY = "TA_CLE_API"
```

## 🛠️ Développement

### Mode développement
```bash
# Watch mode pour le frontend
npm run watch

# Logs Python
tail -f ~/homebrew/logs/achievement-tracker/plugin.log
```

### Structure des données

**Achievement Object:**
```typescript
{
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlock_time?: string;
  icon?: string;
  rarity?: number;
  progress?: string;
}
```

**Game Progress:**
```typescript
{
  playtime_total: number;     // minutes
  playtime_session: number;   
  completion: {
    story: number;           // %
    total: number;           
    collectibles: number;    
  }
}
```

## 📝 Améliorations futures

- [ ] Intégration complète API Steam
- [ ] Système de notifications pour nouveaux achievements
- [ ] Graphiques de progression temporelle
- [ ] Export des stats en CSV/JSON
- [ ] Comparaison avec amis Steam
- [ ] Support multi-comptes
- [ ] Thèmes personnalisables
- [ ] Widget pour l'écran d'accueil

## 🐛 Troubleshooting

### Le plugin n'apparaît pas
- Vérifie que Decky Loader est bien installé
- Assure-toi que le dossier est dans `~/homebrew/plugins/`
- Redémarre le Steam Deck

### Pas de données d'achievements
- Vérifie que le jeu supporte les achievements Steam
- Lance le jeu au moins une fois
- Utilise le bouton Rafraîchir

### Erreurs Python
```bash
# Check les logs
journalctl -u plugin_loader -f
# ou
cat ~/homebrew/logs/achievement-tracker/plugin.log
```

## 📄 License

MIT License - Fais-en ce que tu veux !

## 🤝 Contribution

Les PRs sont les bienvenues ! N'hésite pas à :
- Reporter des bugs
- Proposer des nouvelles fonctionnalités
- Améliorer le code
- Traduire l'interface

## 💬 Support

- **Issues GitHub** : [Lien vers ton repo]/issues
- **Discord Decky** : https://discord.gg/deckyloader

---

Créé avec ❤️ pour la communauté Steam Deck

**Enjoy tracking tes achievements !** 🎮🏆