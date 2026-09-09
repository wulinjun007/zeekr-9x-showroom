import {registerHooks} from 'node:module';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
registerHooks({resolve(specifier,context,next){if(specifier.startsWith('.')&&context.parentURL&&!/\.[a-z]+$/i.test(specifier)){const u=new URL(specifier+'.ts',context.parentURL);if(existsSync(fileURLToPath(u)))return next(u.href,context);}return next(specifier,context);}});
