PREACHERS – DISCORD GODKENDELSE

1) Installer Node.js.
2) Åbn mappen i VS Code.
3) Terminal:
   npm install
   npm start
4) Åbn http://localhost:3000

ADMIN:
Brugernavn: admin
Adgangskode: preachers2026 (skift den i miljøvariabler før offentlig brug)

DISCORD:
- Ansøgeren skal indtaste sit Discord User ID.
- Når admin trykker "GODKEND + SEND DISCORD", forsøger serveren at sende en privat DM.
- Bot-token skal sættes som DISCORD_TOKEN på serveren. DEL ALDRIG tokenet med andre.
- Sæt jeres invite som DISCORD_INVITE_URL.

Discord-botten skal være installeret på mindst én server og have en gyldig bot-token. Brugeren skal kunne modtage DM fra botten; hvis Discord blokerer DM, vises fejlstatus i adminpanelet.

HTTPS:
Denne kode er klar til hosting bag en HTTPS reverse proxy (fx Render, Railway, Cloudflare Tunnel eller Nginx). Lad hosten håndtere TLS/HTTPS. Hvis du kører lokalt, er adressen http://localhost:3000.

VIGTIGT:
- Brug aldrig en bot-token direkte i index.html.
- Sæt DISCORD_TOKEN som en secret/environment variable hos hosten.
- Skift standard admin-adgangskoden.
