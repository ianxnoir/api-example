export class GenerateHashDto {    
    fairCode: string
    slug: string
    visitorType: string
    country?: string = ''
    refOverseasOffice: string 
    refCode?: string
    saltKey: string
}

