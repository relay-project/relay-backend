## relay-backend

### Environment variables

The `.env` file is required, check [.env.example](./.env.example) for details

### Launch

Server launches in several steps 
1. Environment variables are loaded with `dotenv`
2. Database is created if it does not exist
3. If `MIGRATIONS_ON_STARTUP` environment variable is set to `enabled`, migrations are applied
4. Database connection created
5. Database models are loaded
6. Socket server is launched

Launch the server in development

```shell script
npm run dev
```

### Database

Database scheme is presented on a [scheme file](./relay.png) (scheme is created with https://diagrams.net)

Application checks database existence and creates database automatically when it is launched for the first time

All of the database changes should be done using migrations
1. Update the graphical representation of the database
2. Generate a new migration file and add all of the necessary changes
3. Update the model or create model in the [src/database/models](./src/database/models) directory
4. Update the type or create type in the [src/types/database.ts](./src/types/database.ts) file
5. Run migration process manually or launch the project if migrations are applied automatically

### Migrations

Migration files are located in the [database/migrations](./database/migrations) directory

Migrations can be applied automatically by setting the `MIGRATIONS_ON_STARTUP` environment variable to `enabled`

Apply existing migrations manually

```shell script
npm run migrate
```

Generate a new migration file

```shell script
npx sequelize-cli migration:generate --name <MIGRATION_NAME>
```

Additional documentation:
https://sequelize.org/docs/v7/other-topics/migrations

### License

[MIT](./LICENSE.md)
