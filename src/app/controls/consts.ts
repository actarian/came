
export enum MtmControlType {
	Select = 1,
	Group = 2,
	List = 3,
	Grid = 4,
}

export const MTM_MAP: any = {
	'Code': {
		key: 'code', name: 'Codice'
	},
	'SingleModuleFrame': {
		key: 'singleModuleFrame'
	},
	'Finish': {
		key: 'finish', name: 'Finitura'
	},
	'ModuleSize': {
		key: 'moduleSize', name: 'Numero di moduli', description: 'Quanto spazio ti serve? Consulta la guida.', type: MtmControlType.Group
	},
	'Mount': {
		key: 'mount'
	},
	'System': {
		key: 'system', name: 'Sistema', description: 'Scopri le tecnologie e funzionalità dei sistemi Came.', type: MtmControlType.Grid
	},
	'AV': {
		key: 'audioVideo', name: 'Caratteristiche Audio / Video', type: MtmControlType.Group
	},
	'Keypad': {
		key: 'keypad', name: 'Tastiera per il controllo accessi', description: 'Tastiera numerica per la sicurezza', type: MtmControlType.Group
	},
	'Proximity': {
		key: 'proximity', name: 'Modulo di prossimità', description: 'Accesso automatico tramite scansione RFID', type: MtmControlType.Group
	},
	'InfoModule': {
		key: 'infoModule', name: 'Modulo informazioni', description: 'Vuoi fornire indicazioni? Usa il modulo retroilluminato', type: MtmControlType.Group
	},
	'HearingModule': {
		key: 'hearingModule', name: 'Modulo di sintesi vocale', description: 'Disponi di apparecchio acustico con interfaccia magnetica?', type: MtmControlType.Group
	},
	'DigitalDisplay': {
		key: 'digitalDisplay', name: 'Display Digitale'
	},
	'moduliaggiuntivi': {
		key: 'additionalModules'
	},
	'Buttons': {
		key: 'buttons', name: 'Pulsanti di chiamata', type: MtmControlType.List
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
