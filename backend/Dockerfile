FROM php:8.2-apache

# Activer mod_rewrite
RUN a2enmod rewrite

# Installer PDO PostgreSQL + MySQL
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pdo_mysql \
    && rm -rf /var/lib/apt/lists/*

# Copier le backend
COPY . /var/www/html/

# Autoriser .htaccess
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Port 10000 (Render)
RUN sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf
RUN sed -i 's/:80/:10000/' /etc/apache2/sites-available/000-default.conf

EXPOSE 10000
