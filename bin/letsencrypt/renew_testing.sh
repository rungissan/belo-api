echo 'start renewing letsencrypt cert'

docker run --rm \
  -v /etc/nginx/certroot:/etc/nginx/certroot \
  -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly --force-renewal \
  -d a.testing.opporty.com \
  --cert-name a.opporty.cert \
  --webroot -w /etc/nginx/certroot -m webmaster@opporty.com --agree-tos

echo 'reload nginx service'

systemctl reload nginx.service

echo 'end renewing letsencrypt cert'
