

export const USE_CALCULATED_PRICE = true;
export const MAX_APARTMENTS = 48;

export enum MtmControlType {
	Select = 1,
	Group = 2,
	List = 3,
	Grid = 4,
}

export enum MtmSortType {
	String = 0,
	Numeric = 1,
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

export class MtmControls {

	static selectNone = { id: -1, name: 'Select', value: -1 };

	static withLocale(locale: { [key: string]: string; }): any[] {
		MtmControls.selectNone.name = locale.selectNone || 'Select';
		return [{
			key: MtmControlEnum.Code, name: 'Code'
		}, {
			key: MtmControlEnum.Digi, name: 'Digi', lazy: true, nullable: true,
		}, {
			key: MtmControlEnum.ButtonType, name: 'ButtonType', lazy: true,
		}, {
			key: MtmControlEnum.SingleModuleFrame, disabled: true,
		}, {
			key: MtmControlEnum.Finish, name: locale.finishName, type: MtmControlType.Group, defaultNames: ['Aluminium', 'Alluminio'], lazy: true, // defaultId: 2,
		}, {
			key: MtmControlEnum.ModuleSize, name: locale.moduleSizeName, description: locale.moduleSizeDescription, type: MtmControlType.Group
		}, {
			key: MtmControlEnum.Mount, name: locale.mountName, type: MtmControlType.List, lazy: true, dynamicPicture: true,
		}, {
			key: MtmControlEnum.System, name: locale.systemName, description: locale.systemDescription, type: MtmControlType.Grid
		}, {
			key: MtmControlEnum.AudioVideo, name: locale.audioVideoName, type: MtmControlType.Group
		}, {
			key: MtmControlEnum.Keypad, name: locale.keypadName, description: locale.keypadDescription, type: MtmControlType.List, lazy: true, nullable: true
		}, {
			key: MtmControlEnum.Proximity, name: locale.proximityName, description: locale.proximityDescription, type: MtmControlType.Group, lazy: true, nullable: true
		}, {
			key: MtmControlEnum.InfoModule, name: locale.infoModuleName, description: locale.infoModuleDescription, type: MtmControlType.Group, lazy: true, nullable: true
		}, {
			key: MtmControlEnum.HearingModule, name: locale.hearingModuleName, description: locale.hearingModuleDescription, type: MtmControlType.Group, lazy: true, nullable: true
		}, {
			key: MtmControlEnum.DigitalDisplay, name: locale.digitalDisplayName, description: locale.digitalDisplayDescription, type: MtmControlType.Group, lazy: true, nullable: true
		}, {
			key: MtmControlEnum.AdditionalModules, disabled: true,
		}, {
			key: MtmControlEnum.Buttons, name: locale.apartmentNumberName, type: MtmControlType.Select, sortType: MtmSortType.Numeric, nullable: true, lazy: true, className: 'control--list--sm',
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
			key: MtmControlEnum.KnownTecnology, name: locale.knownTecnologyName, type: MtmControlType.Group, className: 'control--group--sm',
			values: [
				{ id: 1, name: locale.buttonNoName },
				{ id: 2, name: locale.buttonYesName },
			]
		},
		{
			key: MtmControlEnum.ConstrainedDimension, name: locale.constrainedDimensionName, type: MtmControlType.Group, className: 'control--group--sm',
			values: [
				{ id: 1, name: locale.buttonNoName },
				{ id: 2, name: locale.buttonYesName },
			]
		},
		{
			key: MtmControlEnum.ApartmentNumber, name: locale.apartmentNumberName, type: MtmControlType.Select, sortType: MtmSortType.Numeric, nullable: true, lazy: true, className: 'control--list--sm',
			values: new Array(27).fill(0).map((x: number, i: number) => {
				if (i === 26) {
					return { id: 48, name: '> 26', value: 48 };
				} else {
					return { id: i + 1, name: (i + 1).toFixed(0), value: i + 1 };
				}
			})
		}, {
			key: MtmControlEnum.CallButtons, name: locale.callButtonsName, type: MtmControlType.List, lazy: true, className: 'control--list--sm',
			values: [
				{ id: 1, name: locale.buttonSingleName },
				{ id: 2, name: locale.buttonDoubleName },
				{ id: 3, name: locale.buttonDigitalName },
				{ id: 4, name: locale.buttonDigitalDigi1Name },
				{ id: 5, name: locale.buttonDigitalDigi2Name },
			]
		}, // default
		{
			key: MtmControlEnum.Default, name: 'name', description: 'description', type: MtmControlType.Group
		}];
	}

}
