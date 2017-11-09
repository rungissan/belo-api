# Let’s Encrypt
Using certbot docker image to setup letsencrypt certificates
https://community.letsencrypt.org/t/how-to-get-a-lets-encrypt-certificate-while-using-cloudflare/6338
https://hub.docker.com/r/certbot/certbot/

### Initial setup
```bash
./init_prod.sh # for production
./init_testing.sh # for testing

systemctl reload nginx.service
```
### Setup cron
root for nginx.service
```bash
sudo crontab -u root -e
```
Production
```bash
0 0 * * 0 cd /home/opporty/oporty-server/bin/letsencrypt && ./renew_prod.sh >> /tmp/crontab.log
```
Testing
```bash
0 0 * * 0 cd /home/opporty/oporty-server/bin/letsencrypt && ./renew_testing.sh >> /tmp/crontab.log
```
