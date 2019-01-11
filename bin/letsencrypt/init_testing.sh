docker run --rm \
  -v /etc/nginx/certroot:/etc/nginx/certroot \
  -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly \
  -d autohub.od.ua \
  --cert-name belo.cert \
  --webroot -w /etc/nginx/certroot -m autohub.od.ua@gmail.com --agree-tos
