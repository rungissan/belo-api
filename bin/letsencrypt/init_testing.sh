docker run --rm \
  -v /etc/nginx/certroot:/etc/nginx/certroot \
  -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly \
  -d a.testing.opporty.com \
  --cert-name a.opporty.cert \
  --webroot -w /etc/nginx/certroot -m webmaster@opporty.com --agree-tos
