#!/bin/sh

. ./.env
COMMANDS=""

for PORT in $PROXY_PORTS; do
  COMMANDS="$COMMANDS netsh interface portproxy delete v4tov4 listenport=$PORT listenaddress=0.0.0.0;"
done

if [ -z "$COMMANDS" ]; then
  echo "Nenhuma porta informada. Defina PROXY_PORTS."
  exit 1
fi

powershell.exe -Command "Start-Process powershell -Verb RunAs -ArgumentList \"$COMMANDS\""