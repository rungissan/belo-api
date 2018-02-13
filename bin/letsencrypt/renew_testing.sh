echo 'start renewing letsencrypt cert'

docker run --rm \
  -v /etc/nginx/certroot:/etc/nginx/certroot \
  -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly --force-renewal \
  -d spiti.clever-hosting.com \
  --cert-name spiti.cert --expand \
  --webroot -w /etc/nginx/certroot -m spiti.social.testing@gmail.com --agree-tos

echo 'reload nginx service'

docker restart spiti_balancer_1

echo 'end renewing letsencrypt cert'
