import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export interface SearchFairParticipantsInterface {
  keyword: string;
  lang: string;
  from: number;
  size: number;
  fairCodes: string[];
  filterCountry: string[];
  filterNob: string[];
  filterProductCategory: string[];
  filterParticipatingFair: string[];
  // TO-DO: might remove later
  // filterExhibitorNameStartWith: string
  alphabet: string;
  ssoUidList: string[];
  mySsoUid?: string;
  ccdid?: string;
}

export class SearchFairParticipants implements SearchFairParticipantsInterface {

  @IsString()
  public keyword: string;

  @IsString()
  @IsOptional()
  public ccdid: string;

  @IsNotEmpty()
  @IsString()
  public lang: string;

  @IsNotEmpty()
  @IsNumber()
  public from: number;

  @IsNotEmpty()
  @IsNumber()
  public size: number;

  @IsString({each: true})
  public fairCodes: string[];

  @IsString({each: true})
  public filterCountry: string[];

  @IsString({each: true})
  @IsOptional()
  public filterParticipatingFair: string[];

  @IsString({each: true})
  public filterNob: string[];

  @IsString({each: true})
  public filterProductCategory: string[];

  @IsString()
  public alphabet: string;

  @IsString({each: true})
  public ssoUidList: string[];

  @IsString()
  @IsOptional()
  public browserCountry : string;
}

export class SearchFairParticipantsResponse {
  data: SearchFairParticipantsData

  constructor(){
    this.data = new SearchFairParticipantsData()
  }
}

export class SearchFairParticipantsData {
  aggregations: SearchFairParticipantsAggregations
  hits: SearchFairParticipantsUserData[]
  from: number
  size: number
  total_size: number
  sensitiveKeyword: boolean

  constructor(){
    this.aggregations = new SearchFairParticipantsAggregations()
    this.hits = []
    this.from = 0
    this.size = 0
    this.total_size = 0
    this.sensitiveKeyword = false
  }
}

export class SearchFairParticipantsUserData {
  fairParticipantId: string
  firstName: string
  lastName: string
  initial: string
  displayName: string
  position: string
  companyName: string
  country: string
  countryCode: string
  ssoUid: string
  emailId: string
  fairCode: string
  fiscalYear: string
}

export class SearchFairParticipantsAggregations {
  participatingFair: SearchFairParticipantsAggregationItem[]
  countrySymbol: SearchFairParticipantsAggregationItem[]
  natureofBusinessSymbols: SearchFairParticipantsAggregationItem[]
  productCategoryList: SearchFairParticipantsAggregationItem[]

  constructor(){
    this.participatingFair = []
    this.countrySymbol = []
    this.natureofBusinessSymbols = []
    this.productCategoryList = []
  }
}

export class SearchFairParticipantsAggregationItem {
  status: number
  id: string
  label?: string
}

export class ConvertedFairParticipantSearchDto {
  filterFair: FairFilterDto[]
  filterCountry: string[]
  filterNob: string[]
  filterProductCategory: string[]
  alphabet: string
  ssoUidList: string[]
  hiddenRecordList: string[]
  keyword: string
  from: number
  size: number
  ccdid?: string
}

export class FairFilterDto {
  fairCode: string
  fiscalYear: string
}