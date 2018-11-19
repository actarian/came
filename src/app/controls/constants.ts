
const MtmMaxApartments = 48;

export enum MtmControlType {
	Select = 1,
	Group = 2,
	List = 3,
	Grid = 4,
}

export enum MtmControlEnum {
	Code = 'Code',
	SingleModuleFrame = 'Single Module Frame',
	Finish = 'Finish',
	ModuleSize = 'Module Size',
	Mount = 'Mount',
	System = 'System',
	AudioVideo = 'A/V',
	Keypad = 'Keypad',
	Proximity = 'Proximity',
	InfoModule = 'Info Module',
	HearingModule = 'Hearing Module',
	DigitalDisplay = 'Digital Display',
	AdditionalModules = 'moduli aggiuntivi',
	Buttons = 'Buttons',
	Divided = 'Divided',
	Mounting = 'Mounting',
	FlushRainshield = 'Flush Rainshield',
	Frame = 'Frame',
	Module1 = 'Electronics Module 1',
	Front1 = 'Front Piece 1',
	Module2 = 'Electronics Module 2',
	Front2 = 'Front Piece 2',
	Module3 = 'Electronics Module 3',
	Front3 = 'Front Piece 3',
	Module4 = 'Electronics Module 4',
	Front4 = 'Front Piece 4',
	Identifier = 'CI',
	Description = 'Description',
	Price = 'Price',
	// customs
	KnownTecnology = 'KnownTecnology',
	ConstrainedDimension = 'ConstrainedDimension',
	ApartmentNumber = 'ApartmentNumber',
	CallButtons = 'CallButtons',
	// default
	Default = 'None',
}
// Code,Single Module Frame,Finish,Module Size,Mount,System,A/V,Keypad,Proximity,Info Module,Hearing Module,Digital Display,moduli aggiuntivi,Buttons,Divided,Mounting,Flush Rainshield,Frame,Electronics Module 1,Front Piece 1,Electronics Module 2,Front Piece 2,Electronics Module 3,Front Piece 3,Electronics Module 4,Front Piece 4,CI,

export const MtmControls: any[] = [{
	key: MtmControlEnum.Code, name: 'Codice'
}, {
	key: MtmControlEnum.SingleModuleFrame
}, {
	key: MtmControlEnum.Finish, name: 'Finitura', type: MtmControlType.Group
}, {
	key: MtmControlEnum.ModuleSize, name: 'Numero di moduli', description: 'Quanto spazio ti serve? Consulta la guida.', type: MtmControlType.Group
}, {
	key: MtmControlEnum.Mount, name: 'Installazione', type: MtmControlType.List
}, {
	key: MtmControlEnum.System, name: 'Sistema', description: 'Scopri le tecnologie e funzionalità dei sistemi Came.', type: MtmControlType.Grid
}, {
	key: MtmControlEnum.AudioVideo, name: 'Caratteristiche Audio / Video', type: MtmControlType.Group
}, {
	key: MtmControlEnum.Keypad, name: 'Tastiera per il controllo accessi', description: 'Tastiera numerica per la sicurezza', type: MtmControlType.List, nullable: true
}, {
	key: MtmControlEnum.Proximity, name: 'Modulo di prossimità', description: 'Accesso automatico tramite scansione RFID', type: MtmControlType.Group, nullable: true
}, {
	key: MtmControlEnum.InfoModule, name: 'Modulo informazioni', description: 'Vuoi fornire indicazioni? Usa il modulo retroilluminato', type: MtmControlType.Group, nullable: true
}, {
	key: MtmControlEnum.HearingModule, name: 'Modulo di sintesi vocale', description: 'Disponi di apparecchio acustico con interfaccia magnetica?', type: MtmControlType.Group, nullable: true
}, {
	key: MtmControlEnum.DigitalDisplay, name: 'Display Digitale',
}, {
	key: MtmControlEnum.AdditionalModules
}, {
	key: MtmControlEnum.Buttons, name: 'Pulsanti di chiamata', type: MtmControlType.List,
}, {
	key: MtmControlEnum.Divided
}, {
	key: MtmControlEnum.Mounting
}, {
	key: MtmControlEnum.FlushRainshield
}, {
	key: MtmControlEnum.Frame
}, {
	key: MtmControlEnum.Module1
}, {
	key: MtmControlEnum.Front1
}, {
	key: MtmControlEnum.Module2
}, {
	key: MtmControlEnum.Front2
}, {
	key: MtmControlEnum.Module3
}, {
	key: MtmControlEnum.Front3
}, {
	key: MtmControlEnum.Module4
}, {
	key: MtmControlEnum.Front4
}, {
	key: MtmControlEnum.Identifier
}, {
	key: MtmControlEnum.Description
}, {
	key: MtmControlEnum.Price
}, // customs
{
	key: MtmControlEnum.KnownTecnology, name: 'Conosci già la tecnologia da adottare?', type: MtmControlType.Group,
	values: [
		{ id: 1, name: 'No' },
		{ id: 2, name: 'Sì' },
	], className: 'control--group--sm',
},
{
	key: MtmControlEnum.ConstrainedDimension, name: 'Hai un vincolo sul numero di moduli e dimensione del pannello?', type: MtmControlType.Group,
	values: [
		{ id: 1, name: 'No' },
		{ id: 2, name: 'Sì' },
	], className: 'control--group--sm'
},
{
	key: MtmControlEnum.ApartmentNumber, name: 'Quanti appartamenti o punti interni devi gestire?', type: MtmControlType.Select,
	values: new Array(MtmMaxApartments).fill(0).map((x: number, i: number) => {
		return { id: i + 1, name: (i + 1).toFixed(0) };
	}), className: 'control--list--sm',
}, {
	key: MtmControlEnum.CallButtons, name: 'Pulsanti di chiamata', type: MtmControlType.List,
	values: [],
}, // default
{
	key: MtmControlEnum.Default, name: 'name', description: 'description', type: MtmControlType.Group
},
];
