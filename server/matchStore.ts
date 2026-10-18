import fs from 'node:fs';
import path from 'node:path';
import type {GameRoom} from '../src/types';
export interface SavedMatches {version:1;rooms:GameRoom[];sessions:any[]}
/** Atomic snapshots. Never serve this directory as static content: it contains private game data. */
export class MatchStore {
  private file:string;
  constructor(directory=path.resolve(process.env.FAMPLAY_DATA_DIR||'.data')) {this.file=path.join(directory,'matches.json');}
  load():SavedMatches {
    if(!fs.existsSync(this.file))return {version:1,rooms:[],sessions:[]};
    const data=JSON.parse(fs.readFileSync(this.file,'utf8'));
    if(data.version!==1||!Array.isArray(data.rooms)||!Array.isArray(data.sessions))throw new Error('Unbekanntes Spielstandformat.');
    return data;
  }
  save(rooms:GameRoom[],sessions:any[]) {
    fs.mkdirSync(path.dirname(this.file),{recursive:true});
    const temporary=this.file+'.tmp';
    fs.writeFileSync(temporary,JSON.stringify({version:1,rooms,sessions}),{encoding:'utf8',mode:0o600});
    fs.renameSync(temporary,this.file);
  }
}
