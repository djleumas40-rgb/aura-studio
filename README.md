# 🎵 AURA · Studio IA Musical

Application de génération musicale IA — upload une musique de référence, l'IA analyse son style et crée une nouvelle composition originale avec Mureka AI.

## Déploiement sur Vercel (10 minutes)

### Étape 1 — Clés API nécessaires

**Mureka API** (génération musicale) :
1. Va sur https://platform.mureka.ai
2. Crée un compte → onglet "API Keys"
3. Crée une clé et copie-la

**Anthropic API** (analyse du mood) :
1. Va sur https://console.anthropic.com
2. API Keys → Create Key
3. Copie la clé

### Étape 2 — Mettre le projet sur GitHub

1. Va sur https://github.com → "New repository"
2. Nomme-le `aura-studio` → Create
3. Dans ton terminal :
```bash
cd aura-studio
git init
git add .
git commit -m "AURA Studio - premier déploiement"
git remote add origin https://github.com/TON_USERNAME/aura-studio.git
git push -u origin main
```

### Étape 3 — Déployer sur Vercel

1. Va sur https://vercel.com → "New Project"
2. Importe ton repo `aura-studio`
3. Dans "Environment Variables", ajoute :
   - `MUREKA_API_KEY` = ta clé Mureka
   - `ANTHROPIC_API_KEY` = ta clé Anthropic
4. Clique **Deploy** !

## Workflow de l'app

1. 🎧 Upload ta musique de référence (MP3, WAV, M4A...)
2. 🔍 Mureka analyse le style, genre, mood
3. 🤖 Claude enrichit l'analyse et crée un prompt créatif
4. 🎵 Mureka génère 2 nouvelles compositions originales (~45 sec)
5. ▶ Écoute et télécharge directement

## Développement local

```bash
npm install
cp .env.local.example .env.local
# Remplis les clés dans .env.local
npm run dev
# Ouvre http://localhost:3000
```
