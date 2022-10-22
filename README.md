## relay-backend

### Launch

```shell script
npm run dev
```

### Migrations

Migration files are located in the [database/migrations](./database/migrations) directory

Apply existing migrations

```shell script
npm run migrate
```

Generate a new migration file

```shell script
npx sequelize-cli migration:generate --name <MIGRATION_NAME>
```

### License

[MIT](./LICENSE.md)
