import * as dotenv from 'dotenv';
dotenv.config();
import Logger from '../utils/logger';
import Meeting from '../api/model/Meetings';

const syncTables = () => Promise.all([Meeting.sync()]);

export default function sync() {
    syncTables().then((result) => Logger.info(`Database Info: Tables Synced - ${result}`))
    .catch((error) => Logger.error(`Database Error: ${error}`))
    .finally(() => process.exit());
}
