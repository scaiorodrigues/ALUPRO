import { Profile, Company } from '../types'

export const MOCK_COMPANIES: Company[] = [
  { id: '1', name: 'Brasal',  logo_url: null, website: null, updated_at: new Date().toISOString() },
  { id: '2', name: 'Hydro',   logo_url: null, website: null, updated_at: new Date().toISOString() },
  { id: '3', name: 'Albrás',  logo_url: null, website: null, updated_at: new Date().toISOString() },
  { id: '4', name: 'Alcoa',   logo_url: null, website: null, updated_at: new Date().toISOString() },
  { id: '5', name: 'Novelis', logo_url: null, website: null, updated_at: new Date().toISOString() },
]

export const MOCK_PROFILES: Profile[] = [
  { id:'1', company_id:'1', line_id:'1', name:'T-3030',   weight_per_meter:0.842, application:'Estrutural / Energia Solar', drawing_url:null, technical_pdf:null, tags:['solar','estrutural','rack'],    popular:true,  description:'Perfil em T para montagem de painéis solares fotovoltaicos.', created_at:new Date().toISOString(), updated_at:new Date().toISOString(), company: MOCK_COMPANIES[0] },
  { id:'2', company_id:'2', line_id:'2', name:'U-40x40',  weight_per_meter:1.124, application:'Guias e Trilhos',            drawing_url:null, technical_pdf:null, tags:['industrial','guia','trilho'],   popular:true,  description:'Perfil em U para aplicações industriais.',                     created_at:new Date().toISOString(), updated_at:new Date().toISOString(), company: MOCK_COMPANIES[1] },
  { id:'3', company_id:'3', line_id:'3', name:'L-30x30',  weight_per_meter:0.487, application:'Acabamento / Moldura',       drawing_url:null, technical_pdf:null, tags:['arquitetônico','moldura'],      popular:false, description:'Cantoneira para acabamentos arquitetônicos.',                  created_at:new Date().toISOString(), updated_at:new Date().toISOString(), company: MOCK_COMPANIES[2] },
  { id:'4', company_id:'1', line_id:'2', name:'F-6060',   weight_per_meter:1.810, application:'Estrutural / Automação',     drawing_url:null, technical_pdf:null, tags:['industrial','automação'],       popular:true,  description:'Perfil F para células de automação e bancadas modulares.',     created_at:new Date().toISOString(), updated_at:new Date().toISOString(), company: MOCK_COMPANIES[0] },
  { id:'5', company_id:'2', line_id:'4', name:'C-50x25',  weight_per_meter:0.963, application:'Esquadrias / Janelas',       drawing_url:null, technical_pdf:null, tags:['esquadria','janela'],           popular:false, description:'Perfil para fabricação de esquadrias de alumínio.',            created_at:new Date().toISOString(), updated_at:new Date().toISOString(), company: MOCK_COMPANIES[1] },
  { id:'6', company_id:'3', line_id:'1', name:'H-2020',   weight_per_meter:0.621, application:'Trilho Solar / Fixação',     drawing_url:null, technical_pdf:null, tags:['solar','trilho','fixação'],     popular:false, description:'Trilho H para fixação de painéis solares.',                   created_at:new Date().toISOString(), updated_at:new Date().toISOString(), company: MOCK_COMPANIES[2] },
  { id:'7', company_id:'4', line_id:'2', name:'I-8080',   weight_per_meter:2.340, application:'Estrutural Pesado',          drawing_url:null, technical_pdf:null, tags:['estrutural','pesado','viga'],   popular:false, description:'Viga I para estruturas industriais de grande porte.',         created_at:new Date().toISOString(), updated_at:new Date().toISOString(), company: MOCK_COMPANIES[3] },
]
