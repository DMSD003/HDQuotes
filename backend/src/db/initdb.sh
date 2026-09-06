#!/bin/bash

echo -e "\n~~ Initialize the Data base ~~\n"

# 1 verification and loading of the .env file

if [ -f ../../.env ]; then
    echo "Loading environment vars"
    export $(grep -v '^#' ../../.env | xargs)
else
    echo "The .env file is not available in the root of the directory"
    exit 1
fi

# 2 Retrive .env's datas

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER}
DB_NAME=${DB_NAME}
export PGPASSWORD=${DB_PASSWORD}

# 3 Drop the Data Base if exists
dropdb --if-exists -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
# 4 Create the Data Base
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"

# 4 Injecting the shema.sql

if [ -f schema.sql ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"  -d "$DB_NAME" -f schema.sql

else
    echo "schema file Not Found"
    exit 1
fi

# Drop 
unset PGPASSWORD 

echo -e "\n~~ End of the script ~~\n"