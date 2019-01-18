
const MtmMaxApartments = 48;

export enum MtmControlType {
	Select = 1,
	Group = 2,
	List = 3,
	Grid = 4,
}


// code,singleModuleFrame,finish,moduleSize,mount,system,AV,keypad,proximity,infoModule,hearingModule,digitalDisplay,additionalModules,buttons,divided,mounting,
// flushRainshield,frame,electronicsModule1,frontPiece1,electronicsModule2,frontPiece2,electronicsModule3,frontPiece3,electronicsModule4,frontPiece4,ci,description

export enum MtmControlEnum {
	Code = 'code',
	SingleModuleFrame = 'singleModuleFrame',
	Finish = 'finish',
	ModuleSize = 'moduleSize',
	Mount = 'mount',
	System = 'system',
	AudioVideo = 'AV',
	Keypad = 'keypad',
	Proximity = 'proximity',
	InfoModule = 'infoModule',
	HearingModule = 'hearingModule',
	DigitalDisplay = 'digitalDisplay',
	AdditionalModules = 'additionalModules',
	Buttons = 'buttons',
	Divided = 'divided',
	Mounting = 'mounting',
	FlushRainshield = 'flushRainshield',
	Frame = 'frame',
	Module1 = 'electronicsModule1',
	Front1 = 'frontPiece1',
	Module2 = 'electronicsModule2',
	Front2 = 'frontPiece2',
	Module3 = 'electronicsModule3',
	Front3 = 'frontPiece3',
	Module4 = 'electronicsModule4',
	Front4 = 'frontPiece4',
	Identifier = 'ci',
	Description = 'description',
	Price = 'price',
	// customs
	Digi = 'digi',
	ButtonType = 'buttonType',
	KnownTecnology = 'knownTecnology',
	ConstrainedDimension = 'constrainedDimension',
	ApartmentNumber = 'apartmentNumber',
	CallButtons = 'callButtons',
	// default
	Default = 'none',
}
// Code,Single Module Frame,Finish,Module Size,Mount,System,A/V,Keypad,Proximity,Info Module,Hearing Module,Digital Display,moduli aggiuntivi,Buttons,Divided,Mounting,Flush Rainshield,Frame,Electronics Module 1,Front Piece 1,Electronics Module 2,Front Piece 2,Electronics Module 3,Front Piece 3,Electronics Module 4,Front Piece 4,CI,

export const MtmControls: any[] = [{
	key: MtmControlEnum.Code, name: 'Codice'
}, {
	key: MtmControlEnum.Digi, name: 'Digi', lazy: true,
}, {
	key: MtmControlEnum.ButtonType, name: 'ButtonType', lazy: true,
}, {
	key: MtmControlEnum.SingleModuleFrame, disabled: true,
}, {
	key: MtmControlEnum.Finish, name: 'Finitura', type: MtmControlType.Group, lazy: true,
}, {
	key: MtmControlEnum.ModuleSize, name: 'Numero di moduli', description: 'Quanto spazio ti serve? Consulta la guida.', type: MtmControlType.Group
}, {
	key: MtmControlEnum.Mount, name: 'Installazione', type: MtmControlType.List, lazy: true,
}, {
	key: MtmControlEnum.System, name: 'Sistema', description: 'Scopri le tecnologie e funzionalità dei sistemi Came.', type: MtmControlType.Grid
}, {
	key: MtmControlEnum.AudioVideo, name: 'Caratteristiche Audio / Video', type: MtmControlType.Group
}, {
	key: MtmControlEnum.Keypad, name: 'Tastiera per il controllo accessi', description: 'Tastiera numerica per la sicurezza', type: MtmControlType.List, lazy: true, nullable: true
}, {
	key: MtmControlEnum.Proximity, name: 'Modulo di prossimità', description: 'Accesso automatico tramite scansione RFID', type: MtmControlType.Group, lazy: true, nullable: true
}, {
	key: MtmControlEnum.InfoModule, name: 'Modulo informazioni', description: 'Vuoi fornire indicazioni? Usa il modulo retroilluminato', type: MtmControlType.Group, lazy: true, nullable: true
}, {
	key: MtmControlEnum.HearingModule, name: 'Modulo di sintesi vocale', description: 'Disponi di apparecchio acustico con interfaccia magnetica?', type: MtmControlType.Group, lazy: true, nullable: true
}, {
	key: MtmControlEnum.DigitalDisplay, name: 'Display Digitale', description: 'Consente la visualizzazione di una rubrica fino a 7200 nomi e permette la chiamata diretta agli interni attraverso il tasto centrale', type: MtmControlType.Group, lazy: true, nullable: true
}, {
	key: MtmControlEnum.AdditionalModules, disabled: true,
}, {
	key: MtmControlEnum.Buttons, lazy: true, nullable: true,
}, {
	key: MtmControlEnum.Divided, lazy: true, nullable: true,
}, {
	key: MtmControlEnum.Mounting, lazy: true,
}, {
	key: MtmControlEnum.FlushRainshield, lazy: true,
}, {
	key: MtmControlEnum.Frame, lazy: true,
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
	key: MtmControlEnum.Identifier, disabled: true,
}, {
	key: MtmControlEnum.Description, disabled: true,
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
		return { id: i + 1, name: (i + 1).toFixed(0), value: (i + 1) };
	}), className: 'control--list--sm',
}, {
	key: MtmControlEnum.CallButtons, name: 'Pulsanti di chiamata', type: MtmControlType.List,
	values: [
		{ id: 1, name: 'Pulsante singolo' },
		{ id: 2, name: 'Pulsante doppio' },
		{ id: 3, name: 'Digitale' },
		{ id: 4, name: 'Digitale + 1' },
		{ id: 5, name: 'Digitale + 2' },
	], className: 'control--list--sm',
}, // default
{
	key: MtmControlEnum.Default, name: 'name', description: 'description', type: MtmControlType.Group
},
];
