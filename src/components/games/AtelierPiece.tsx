import React from 'react';
import {pieceSprite} from '../../services/gameAssets';
/** One PNG atlas request per family; CSS selects the individual transparent sprite. */
export function AtelierPiece({kind,label,className=''}:{kind:string;label:string;className?:string}) {
  const sprite=pieceSprite(kind);
  return <span role="img" aria-label={label} className={`inline-block shrink-0 pointer-events-none ${className}`} style={{backgroundImage:`url(${sprite.src})`,backgroundSize:`${sprite.columns*100}% 200%`,backgroundPosition:`${sprite.column/(sprite.columns-1)*100}% ${sprite.row*100}%`,backgroundRepeat:'no-repeat'}}/>;
}
