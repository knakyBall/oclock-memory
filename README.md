# oclock-memory

## Introduction

Ce projet un jeu de type memory dans un contexte de test technique pour O'Clock !

Projet accessible en test à l'adresse : http://memory.adopteundev.fr

#### Pourquoi j'ai fait comme ca ?

J'ai utilisé `Laminas` ( anciennement zend framework ou zf3 pour les intimes ),
parce que c'est un framework que je connais bien, et qui m'a permis facilement, 
de gérer un system de session, de pages et de templating HTML.

J'ai utilisé `nodeJS`, car j'avais quand même un soucis de "sécurité" vis-à-vis de
la triche. Je ne pouvais pas mettre directement dans le code HTML les noms des paires.
J'ai donc choisis de les générer sur le serveur, puis coté client de ne mettre que des ids
qui serviraient en fait à révéler les cartes qu'à un certain moment, et pour un temps donné.
De plus, si j'avais fait ca en PHP, j'aurais dû utiliser l'ajax, sauf que l'ajax sur un
serveur apache et beaucoup moins rapide que du socket.io qui utilise les websockets.
De plus ça m'a permis de faire un système de multijoueurs, qui n'était pas demandé, certes,
mais je me suis amusé à le faire. Petit bonus !

## Evolutions potentielles

Si je devais me servir de ce projet comme appuie de cours, il y aurait quelques exercices pratiques pour les
élèves ayant des bases solides, comme, créer un système de bot, où le joueur jouerait donc contre l'algorithme d'un
élève, avec certaines pénalités sur le bot ( parce que là ... l'homme contre la machine ...) 

Ou des exercices beaucoup plus simples du style, rajouter un compteur "3,2,1 Go !", avant le début d'une partie,
ou encore ajouter un compteur de paires révélées pour l'ajouter au score, ou un système
de niveau, avec plus ou moins de carte, dans un temps plus ou moins grand.

À savoir que ce projet peut être découpé en plusieurs parties, la partie POO, la partie node avec une grosse partie socket.io, la partie 
framework PHP ( dans ce cas la laminas mais ça pourrait être symfony ), la partie HTML, la partie SCSS et la 
partie JS Coté client. 
 
Ce projet, en matière d'appui-cours, pourrait être évolutif du point de vue des élèves,
par exemple au tout début, le jeu était exclusivement solo. 
Et je l'ai fait évoluer au fur et à mesure, de façon à pouvoir y rajouter 2 joueurs et plus 
( maigres le fait que j'ai limité à 2 ).
Les élèvent créeraient donc un jeu multijoueur en partant d'une page blanche au fur et à mesure des cours.

    
    

## Cloner le projet
```bash
$ git clone git@github.com:knakyBall/oclock-memory.git /path/to/oclock-memory
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

# Le middleware NodeJS
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

###  ( Attention ne marche que partiellement )

Ce projet contient un fichier `docker-compose.yml` pour une utilisation avec
[docker-compose](https://docs.docker.com/compose/); il utilise le `Dockerfile`
 fourni à la racine du projet. 
 Construisez l'image et lancez la avec :

```bash
$ docker-compose up -d --build
```

A ce niveau, le site est accessible à l'adresse http://localhost:8099

Vous pouvez aussi lancer composer depuis l'image avec la commande `run`.

L'environnement du conteneur est nommé
"oclock_memory", il faut donc passer cette valeur à `docker-compose run`:

```bash
$ docker-compose run oclock_memory composer install
```


# Tips

### Compilation SCSS

Un compilateur de scss est présent dans le projet, il suffit d'executer la commande

```bash
$ npm run scss
```

Ce qui va lancer un watcher sur les fichiers dans le dossier `public/scss` 
et compiler et minifier automatiquement dans le dossier `public/css` 