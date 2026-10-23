// Datos de ejemplo (marcados con ejemplo:true para poder borrarlos de una vez)
function demoData(todayStr){
  const pad=n=>String(n).padStart(2,'0');
  const p=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
  const f=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const add=(n)=>{const d=p(todayStr);d.setDate(d.getDate()+n);return f(d)};
  const now=new Date().toISOString();
  const E={ejemplo:true,createdAt:now,updatedAt:now};
  const professionals=[
    {id:'pro_paulina',nombre:'Dra. Paulina Lopez',especialidad:'Medicina estética',matricula:'MP 0000',telefono:'',color:'#A0674B',activo:true,...E,ejemplo:false},
  ];
  const locations=[
    {id:'loc_consultorio',nombre:'Consultorio principal',direccion:'Completar dirección',ciudad:'Santa Fe',telefono:'',notas:'',...E,ejemplo:false},
  ];
  const config=[{id:'main',metodos:['Efectivo','Transferencia','Mercado Pago','Tarjeta de débito','Tarjeta de crédito','Obra social'],
    horaInicio:'08:00',horaFin:'20:00',duracion:30,
    waTemplate:'¡Hola {nombre}! 🌿 Te escribimos de parte de {profesional} para recordarte tu turno:\n\n📅 {fecha}\n🕐 {hora} hs\n📍 {lugar} — {direccion}\n\nPor favor confirmá tu asistencia respondiendo este mensaje. ¡Te esperamos!',
    createdAt:now,updatedAt:now}];
  const patients=[
    {id:'pac_ej1',nombre:'Lucía',apellido:'Fernández (ejemplo)',dni:'38123456',nacimiento:'1994-05-12',sexo:'Femenino',telefono:'342 155 123456',email:'lucia@ejemplo.com',direccion:'Bv. Gálvez 1234',ciudad:'Santa Fe',obraSocial:'OSDE',afiliado:'0123-4567',ocupacion:'Docente',emergenciaNombre:'Marta (madre)',emergenciaTel:'342 4556677',
     hc:{motivo:'Consulta por manchas faciales y control de piel.',personales:'Sin antecedentes de relevancia.',familiares:'Madre con hipotiroidismo.',alergias:'Ninguna conocida.',medicacion:'Anticonceptivos orales.',cirugias:'Apendicectomía (2012).',habitos:'No fuma. Actividad física 3 veces por semana.',diagnostico:'Melasma epidérmico leve.',observaciones:'Fototipo III. Usar protector solar FPS 50.'},...E},
    {id:'pac_ej2',nombre:'Martín',apellido:'Gómez (ejemplo)',dni:'30987654',nacimiento:'1983-11-03',sexo:'Masculino',telefono:'342 156 987654',email:'',direccion:'San Martín 2450',ciudad:'Santo Tomé',obraSocial:'Particular',afiliado:'',ocupacion:'Contador',emergenciaNombre:'',emergenciaTel:'',
     hc:{motivo:'Control general.',personales:'Hipertensión controlada.',familiares:'',alergias:'Penicilina.',medicacion:'Enalapril 10 mg.',cirugias:'',habitos:'Ex fumador.',diagnostico:'',observaciones:''},...E},
  ];
  const appointments=[
    {id:'tur_ej1',pacienteId:'pac_ej1',profesionalId:'pro_paulina',lugarId:'loc_consultorio',fecha:add(-14),hora:'10:00',duracion:45,motivo:'Primera consulta',estado:'atendido',monto:25000,...E},
    {id:'tur_ej2',pacienteId:'pac_ej1',profesionalId:'pro_paulina',lugarId:'loc_consultorio',fecha:add(0),hora:'10:30',duracion:45,motivo:'Sesión 2 · peeling',estado:'confirmado',monto:30000,...E},
    {id:'tur_ej3',pacienteId:'pac_ej2',profesionalId:'pro_paulina',lugarId:'loc_consultorio',fecha:add(0),hora:'12:00',duracion:30,motivo:'Control',estado:'pendiente',monto:20000,...E},
    {id:'tur_ej4',pacienteId:'pac_ej2',profesionalId:'pro_paulina',lugarId:'loc_consultorio',fecha:add(1),hora:'17:00',duracion:30,motivo:'Resultados de laboratorio',estado:'pendiente',monto:20000,...E},
    {id:'tur_ej5',pacienteId:'pac_ej1',profesionalId:'pro_paulina',lugarId:'loc_consultorio',fecha:add(14),hora:'10:30',duracion:45,motivo:'Sesión 3 · peeling',estado:'pendiente',monto:30000,...E},
  ];
  const sessions=[
    {id:'ses_ej1',pacienteId:'pac_ej1',profesionalId:'pro_paulina',turnoId:'tur_ej1',fecha:add(-14),numero:1,
     evaluacion:'Manchas en pómulos y frente. Piel mixta, sin lesiones activas.',tratamiento:'Limpieza profunda. Peeling suave con ácido mandélico 20%.',indicaciones:'Protector solar FPS 50 cada 3 h. Crema despigmentante de noche.',evolucion:'Buena tolerancia, leve eritema que cedió en 20 min.',proximo:'Peeling en 14 días.',...E},
  ];
  const payments=[
    {id:'pag_ej1',pacienteId:'pac_ej1',turnoId:'tur_ej1',profesionalId:'pro_paulina',fecha:add(-14),monto:25000,metodo:'Transferencia',concepto:'Primera consulta',estado:'pagado',...E},
  ];
  return {professionals,locations,config,patients,appointments,sessions,payments};
}
