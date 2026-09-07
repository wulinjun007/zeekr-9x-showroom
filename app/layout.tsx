import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'ZEEKR 9X — Experience Atelier',description:'独立汽车交互设计作品：探索极氪 9X 外观、三排座舱、部件拆解与 HMI 场景。',metadataBase:new URL('https://zeekr-9x-experience.artful-lily-1819.chatgpt.site'),openGraph:{title:'ZEEKR 9X — Experience Atelier',description:'Explore form, light, space and interaction.',images:['/model-reference.png']},icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh"><body>{children}</body></html>}
