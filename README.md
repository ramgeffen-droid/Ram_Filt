# Ram Fit – MVP

This is a simple installable Progressive Web App (PWA).

## Run locally
Because service workers require HTTP, serve the folder with any local web server:

### Python
```bash
cd ram_fitness_app
python3 -m http.server 8080
```

Then open:
http://localhost:8080

On iPhone:
1. Open the app in Safari.
2. Share → Add to Home Screen.

On Android:
1. Open in Chrome.
2. Menu → Add to Home screen / Install app.

## Data
All data is stored only in the browser's localStorage in this MVP.

## Included
- Today dashboard
- Protein + calorie targets
- Meal selection + completion
- 3 editable weekly workout slots
- Exercise weight/reps/notes logging
- Weight tracking
- Basic progress history
- PWA installation/offline shell

## Next version
- Cloud account + sync
- Real scheduled notifications
- Smarter progressive overload suggestions
- Meal quantities and macros per ingredient
- Calendar / streaks / charts
