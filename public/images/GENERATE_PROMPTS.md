# Générer les photos avant/après (cuisine) avec un outil externe

Comme précisé, je n'ai pas d'outil de génération d'images photoréalistes ici.
Voici comment obtenir de vraies photos IA où **la pièce et les fenêtres restent
identiques**, avec Midjourney / DALL·E / Gemini / Adobe Firefly ou autre.

## La clé : ne pas faire 2 prompts texte séparés

Deux prompts texte indépendants ("cuisine ancienne" / "cuisine moderne")
donneront presque toujours deux pièces différentes (fenêtres, murs,
proportions différents). Pour garder la même pièce, il faut partir d'UNE
image et la transformer, pas en générer deux.

### Méthode recommandée (image-to-image / inpainting)

1. **Génère d'abord la photo "après"** (cuisine rénovée) avec le prompt ci-dessous.
2. **Réutilise cette même image** en entrée ("image-to-image" / "remix" / "edit")
   avec le prompt "avant", en demandant explicitement de garder la structure,
   l'angle de vue, les fenêtres et les proportions identiques, et de ne
   changer que les finitions.

Sur Midjourney : génère l'image 1, puis utilise `/imagine` avec cette image en
référence (`--iw 2` ou plus) + le prompt "avant".
Sur DALL·E / ChatGPT images ou Gemini : utilise la fonction "modifier cette
image" / "edit" en collant l'image générée, plutôt qu'un nouveau prompt texte.
Sur Adobe Firefly : utilise "Generative Fill" sur l'image existante.

### Prompt "après" (cuisine rénovée)

```
Photorealistic interior photo of a modern kitchen, white and light wood
cabinets, warm natural lighting, clean minimalist style, one large window
on the left wall with white frame, white subway tile backsplash, wooden
countertop, straight-on eye-level angle, magazine-quality interior
photography, 35mm lens, no people.
```

### Prompt "avant" (à appliquer À LA MÊME IMAGE, pas un nouveau prompt seul)

```
Edit this exact photo: keep the same room structure, same camera angle,
same window position and size, same wall and ceiling proportions. Replace
the cabinets with worn outdated 1990s beige laminate cabinets, replace the
countertop with dated laminate, replace the backsplash with small dated
tiles, dimmer and yellower lighting, slightly cluttered. Do not change the
room layout, window, or perspective.
```

Si ton outil ne permet pas l'édition d'image (texte uniquement), fais
l'inverse : génère d'abord "avant", puis édite-la en "après" avec le même
principe.

## 2. En attendant, une illustration cohérente déjà dans le code

J'ai mis à jour l'illustration de secours (`RoomIllustration`) pour qu'elle
soit spécifiquement une **cuisine**, avec fenêtre, meubles hauts/bas et plan
de travail **aux mêmes coordonnées exactes** entre "avant" et "après" — seuls
les matériaux/couleurs changent, jamais la structure. C'est ce qui s'affiche
tant que tu n'as pas ajouté `hero-before.jpg` / `hero-after.jpg`.
