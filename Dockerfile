# Static-file container for Google Cloud Run.
# Tread is a no-build static PWA — this just serves the same files you'd put on any
# static host, on the $PORT Cloud Run provides. No app build step is introduced.
FROM nginx:1.27-alpine

# Copy only the deployed app shell (no dev tooling, docs, or git history).
COPY index.html styles.css sw.js manifest.webmanifest \
     icon-64.png icon-192.png icon-512.png \
     /usr/share/nginx/html/

# nginx:alpine renders /etc/nginx/templates/*.template with envsubst at startup,
# so ${PORT} is substituted from the environment (Cloud Run sets it; default 8080).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=8080
