# Comandos para Windows (CMD y PowerShell)

---

CMD (Command Prompt):

Crear dump local a directorio (sin gzip/archivo):
```
mongodump --uri="mongodb://localhost:27017/sistema_gestion" --out="C:\ruta\mongo_dump_dir"
```

Restaurar a Atlas usando variable de entorno (recomendado):
```
set MONGO_ATLAS_PWD=yourpassword
mongorestore --uri="mongodb+srv://gonzalo:%MONGO_ATLAS_PWD%@cluster0.sdkklxl.mongodb.net/sistema_gestion" --dir="C:\ruta\mongo_dump_dir" --drop
```

Restaurar a Atlas con contraseña en línea (no recomendado):
```
mongorestore --uri="mongodb+srv://gonzalo:yourpassword@cluster0.sdkklxl.mongodb.net/sistema_gestion" --dir="C:\ruta\mongo_dump_dir" --drop
```

---

PowerShell:

Crear dump local a directorio (sin gzip/archivo):
```
mongodump --uri="mongodb://localhost:27017/sistema_gestion" --out="C:\mongo-respaldo\sistema_gestion"
```

Restaurar a Atlas usando variable de entorno (recomendado):
```
$env:MONGO_ATLAS_PWD = "yourpassword"
mongorestore --uri="mongodb+srv://gonzalo:$env:MONGO_ATLAS_PWD@cluster0.sdkklxl.mongodb.net/sistema_gestion" --dir="C:\mongo-respaldo\sistema_gestion" --drop
```

Restaurar a Atlas con contraseña en línea (no recomendado):
```
mongorestore --uri="mongodb+srv://gonzalo:hWPLYw5TELAYsv6M@cluster0.sdkklxl.mongodb.net/sistema_gestion" --dir="C:\mongo-respaldo\sistema_gestion" --drop
```

---

Reemplaza la ruta `C:\ruta\mongo_dump_dir` por la carpeta donde quieres guardar/leer el dump.

Si ves el error:

```
don't know what to do with subdirectory "sistema_gestion\sistema_gestion", skipping...
```

es porque el directorio que pasaste a `--dir` ya contiene un subdirectorio con el nombre de la base de datos (doble anidado). En ese caso, apunta `--dir` al padre que contiene la carpeta de la base de datos. Por ejemplo, si el dump está en `C:\mongo-respaldo\sistema_gestion\sistema_gestion`, usa:

CMD:
```
mongorestore --uri="mongodb+srv://gonzalo:%MONGO_ATLAS_PWD%@cluster0.sdkklxl.mongodb.net/sistema_gestion" --dir="C:\mongo-respaldo" --nsInclude="sistema_gestion.*" --drop
```

PowerShell:
```
mongorestore --uri="mongodb+srv://gonzalo:$env:MONGO_ATLAS_PWD@cluster0.sdkklxl.mongodb.net/sistema_gestion" --dir="C:\mongo-respaldo" --nsInclude="sistema_gestion.*" --drop
```

Los scripts `backup_and_restore_mongo.sh` y `backup_and_restore_mongo.ps1` ahora detectan este caso y ajustan automáticamente la ruta de restauración.
