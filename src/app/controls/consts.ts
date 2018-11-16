
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
	Description = '',
}
// Code,Single Module Frame,Finish,Module Size,Mount,System,A/V,Keypad,Proximity,Info Module,Hearing Module,Digital Display,moduli aggiuntivi,Buttons,Divided,Mounting,Flush Rainshield,Frame,Electronics Module 1,Front Piece 1,Electronics Module 2,Front Piece 2,Electronics Module 3,Front Piece 3,Electronics Module 4,Front Piece 4,CI,

export const MTM_MAP: any = {
	'Code': {
		key: 'code', name: 'Codice'
	},
	'SingleModuleFrame': {
		key: 'singleModuleFrame'
	},
	'Finish': {
		key: 'finish', name: 'Finitura', type: MtmControlType.Group
	},
	'ModuleSize': {
		key: 'moduleSize', name: 'Numero di moduli', description: 'Quanto spazio ti serve? Consulta la guida.', type: MtmControlType.Group
	},
	'Mount': {
		key: 'mount', name: 'Montatura', type: MtmControlType.List
	},
	'System': {
		key: 'system', name: 'Sistema', description: 'Scopri le tecnologie e funzionalità dei sistemi Came.', type: MtmControlType.Grid
	},
	'AV': {
		key: 'audioVideo', name: 'Caratteristiche Audio / Video', type: MtmControlType.Group
	},
	'Keypad': {
		key: 'keypad', name: 'Tastiera per il controllo accessi', description: 'Tastiera numerica per la sicurezza', type: MtmControlType.List, nullable: true
	},
	'Proximity': {
		key: 'proximity', name: 'Modulo di prossimità', description: 'Accesso automatico tramite scansione RFID', type: MtmControlType.Group, nullable: true
	},
	'InfoModule': {
		key: 'infoModule', name: 'Modulo informazioni', description: 'Vuoi fornire indicazioni? Usa il modulo retroilluminato', type: MtmControlType.Group, nullable: true
	},
	'HearingModule': {
		key: 'hearingModule', name: 'Modulo di sintesi vocale', description: 'Disponi di apparecchio acustico con interfaccia magnetica?', type: MtmControlType.Group, nullable: true
	},
	'DigitalDisplay': {
		key: 'digitalDisplay', name: 'Display Digitale', nullable: true
	},
	'moduliaggiuntivi': {
		key: 'additionalModules'
	},
	'Buttons': {
		key: 'buttons', name: 'Pulsanti di chiamata', type: MtmControlType.List, nullable: true
	},
	'Divided': {
		key: 'divided'
	},
	'Mounting': {
		key: 'mounting'
	},
	'FlushRainshield': {
		key: 'flushRainshield'
	},
	'Frame': {
		key: 'frame'
	},
	'ElectronicsModule1': {
		key: 'electronicsModule1'
	},
	'FrontPiece1': {
		key: 'frontPiece1'
	},
	'ElectronicsModule2': {
		key: 'electronicsModule2'
	},
	'FrontPiece2': {
		key: 'frontPiece2'
	},
	'ElectronicsModule3': {
		key: 'electronicsModule3'
	},
	'FrontPiece3': {
		key: 'frontPiece3'
	},
	'ElectronicsModule4': {
		key: 'electronicsModule4'
	},
	'FrontPiece4': {
		key: 'frontPiece4'
	},
	'CI': {
		key: 'identifierCode'
	},
	'': {
		key: 'Description'
	},
	Price: {
		key: 'price'
	},
	Default: {
		key: 'key', name: 'name', description: 'description', type: MtmControlType.Group
	},
};
