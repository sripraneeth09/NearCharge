# Migration to MongoDB Atlas

This plan outlines the steps to switch the NearCharge application's database from a local MongoDB instance to MongoDB Atlas, ensuring that the existing collections and their data are preserved.

## User Review Required

> [!IMPORTANT]
> I need the **password** for the MongoDB Atlas user `sripraneethchakka_db_user` to update the connection string in the `.env` file and to potentially assist with data migration.

> [!WARNING]
> Please confirm if you have existing data in your local `NearCharge` database that needs to be migrated to Atlas. If you only need the default seed data (admins, hosts, etc.), the application will automatically populate the new Atlas database on the first run in development mode.

## Proposed Changes

### Backend Configuration

#### [MODIFY] [.env](file:///c:/Users/Chakka%20Sri%20Praneeth/OneDrive/Desktop/Near-charge/back/.env)
- Update `MONGO_URI` to the provided MongoDB Atlas connection string.
- Set `NODE_ENV` to `production` if this is for deployment, or keep as `development` to trigger seeding.

### Data Migration (If needed)
If you have local data to preserve, we can use `mongodump` and `mongorestore` or MongoDB Compass to move the data.

1. **Export Local Data**:
   ```bash
   mongodump --db NearCharge --out ./backup
   ```
2. **Import to Atlas**:
   ```bash
   mongorestore --uri "mongodb+srv://sripraneethchakka_db_user:<PASSWORD>@cluster0.xjtcwgq.mongodb.net/NearCharge" ./backup/NearCharge
   ```

## Open Questions

1. **What is the password for the Atlas DB?**
2. **Do you want me to perform the data migration for you (if tools are available) or just update the connection string?**
3. **Should I name the database `NearCharge` on Atlas?** (The provided URI doesn't specify a database name).

## Verification Plan

### Automated Tests
- Start the backend server and verify the connection logs: `✅ MongoDB connected successfully to: mongodb+srv://...`
- Verify that the seeding process completes (if in development mode).

### Manual Verification
- Log in to the application and verify that the dashboard data (hosts, owners, etc.) is visible and correctly fetched from Atlas.
