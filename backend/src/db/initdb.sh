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

# 2 Check DATABASE_URL
if [ -z "DATABASE_URL" ]; then
    echo "DATABASE_URL is not defined"
    exit 1
fi


# 4 Injecting the shema.sql

if [ -f schema.sql ]; then
    echo "Injecting the schema.sql "
    psql psql -h aws-0-eu-west-2.pooler.supabase.com -p 5432 -U postgres.indackvifxfqhqvpiqhi -d postgres -f schema.sql

else
    echo "schema file Not Found"
    exit 1
fi

echo -e "\n~~ End of the script ~~\n"