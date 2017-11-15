docker run --rm \
  -v /etc/nginx/certroot:/etc/nginx/certroot \
  -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly \
  -d spiti.clever-hosting.com \
  --cert-name spiti.cert \
  --webroot -w /etc/nginx/certroot -m spiti.social.testing@gmail.com --agree-tos
