import { NameHelper } from "./nameHelper"

beforeAll(async () => {
    jest.clearAllMocks()
})

describe('GenerateInitial', () => {
    it('should return empty string if firstname, lastname are empty', () => {
        const result = NameHelper.GenerateInitial("", "")
        expect(result).toEqual("")
    })
    it('should return first char of firstname if lastname are empty', () => {
        const result = NameHelper.GenerateInitial("David", "")
        expect(result).toEqual("D")
    })
    it('should return first char of lastname when lastname is alphabet and firstname is empty', () => {
        const result = NameHelper.GenerateInitial("", "Chan")
        expect(result).toEqual("C")
    })
    it('should return initial when firstname, lastname is alphabet', () => {
        const result = NameHelper.GenerateInitial("Tai Man", "Chan")
        expect(result).toEqual("TC")
    })
    it('should return first char of lastname when lastname is not alphabet', () => {
        const result = NameHelper.GenerateInitial("大文", "陳")
        expect(result).toEqual("陳")
    })
})

describe('GenerateDisplayName', () => {
    it('can construct name for CJK first name last name', () => {
        const result = NameHelper.GenerateDisplayName("大文","陳")
        expect(result).toEqual("陳大文")
    })
    it('can construct name for non CJK first name last name', () => {
        const result = NameHelper.GenerateDisplayName("Tai Man","Chan")
        expect(result).toEqual("Tai Man Chan")
    })
})

describe('testCJK', () => {
    it('should return true if input is CJK string', () => {
        const result = NameHelper.testCJK("陳")
        expect(result).toEqual(true)
    })
    it('should return false if input is not a CJK string', () => {
        const result = NameHelper.testCJK("Chan")
        expect(result).toEqual(false)
    })
    it('should return false if input non a string', () => {
        const result = NameHelper.testCJK(0)
        expect(result).toEqual(false)
    })
})