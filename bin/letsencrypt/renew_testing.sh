echo 'start renewing letsencrypt cert'

docker run --rm \
  -v /etc/nginx/certroot:/etc/nginx/certroot \
  -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly --force-renewal \
  -d autohub.od.ua \
  --cert-name belo.cert --expand \
  --webroot -w /etc/nginx/certroot -m autohub.od.ua@gmail.com --agree-tos

echo 'reload nginx service'

docker restart belo_balancer_1

echo 'end renewing letsencrypt cert'
