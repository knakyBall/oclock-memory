# oclock-memory

## Introduction

Ce projet un jeu de type memory dans un contexte de test technique pour O'Clock !

## Cloner le projet
```bash
$ git clone git@github.com:knakyBall/oclock-memory.git path/to/install
```

## Installation du serveur web

### Installation via Apache


Pour configurer apache, configurez un virtual host pour pointer vers le répertoire public/ du
projet et ça devrait être OK pour la suite ! Cela devrait ressembler à quelque chose comme ceci :

```apache
<VirtualHost *:80>
    ServerName memory.adopteundev.fr
    DocumentRoot /path/to/oclock-memory/public
    <Directory /path/to/oclock-memory/public>
        DirectoryIndex index.php
        AllowOverride All
        Order allow,deny
        Allow from all
        <IfModule mod_authz_core.c>
        Require all granted
        </IfModule>
    </Directory>
</VirtualHost>
```

### Installation via Nginx

Pour installer via nginx, ouvrez le fichier `/path/to/nginx/nginx.conf` et ajouter un
[directive d'inclusion](http://nginx.org/en/docs/ngx_core_module.html#include) dans le block `http` si il n'existe pas déjà:

```nginx
http {
    # ...
    include sites-enabled/*.conf;
}
```

Créez un fichier de configuration de virtual host pour votre projet sous `/path/to/nginx/sites-enabled/laminasapp.localhost.conf`
Cela devrait ressembler à quelque chose comme ceci :

```nginx
server {
    listen       80;
    server_name  memory.adopteundev.fr;
    root         /path/to/oclock-memory/public;

    location / {
        index index.php;
        try_files $uri $uri/ @php;
    }

    location @php {
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_param  SCRIPT_FILENAME /path/to/oclock-memory/public/index.php;
        include fastcgi_params;
    }
}
```

Redémarrez nginx, et ça devrait être OK pour la suite !

Une fois le dépôt cloné, il n'y a plus qu'à installer les dépendances.

```bash
$ cd path/to/install
$ composer install
$ bower install
```

Ces commandes vont permettre d'installer toutes les dépendances du client.

**Note:** Il faut ensuite lancer le middleware en *nodejs*.

#Le middleware NodeJS
Dans un premier temps il faut récupérer la configuration par défaut.

Pour ceci, il faut faire la commande suivante :
```bash
$ cp node_server/config/index.dist.js node_server/config/index.js
```

Ensuite vous pouvez lancer le serveur avec la commande suivante :
```bash
$ npm start
# OU utiliser la commande node directement
$ node node_server/index.js console silly # 'console' pour avoir les logs et 'silly' pour le niveau de logs
```

## Utiliser docker-compose

Ce projet contient un fichier `docker-compose.yml` pour une utilisation avec
[docker-compose](https://docs.docker.com/compose/); il utilise le `Dockerfile`
 fourni à la racine du projet. 
 Construisez l'image et lancez la avec :

```bash
$ docker-compose up -d --build
```

A ce niveau, vous pouvez visiter http://localhost:8080 pour voir le site fonctionner

Vous pouvez aussi lancer composer depuis l'image. L'environnement du conteneur est nommé
"oclock_memory", vous passerez donc cette valeur à `docker-compose run`:

```bash
$ docker-compose run oclock_memory composer install
```
