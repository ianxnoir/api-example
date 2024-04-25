import csv

def convert_visitor_type_csv_to_sql_insert_statement():
    insert_sql_stat = "INSERT INTO visitorType(visitorTypeCode, visitorTypeDesc, visitorTypeCategory, createdBy, lastUpdatedBy)"

    def _get_sql_values(row):

        VISITOR_TYPE_CAT = ''

        if row[2] == 'Buyer':
            VISITOR_TYPE_CAT = '@VISITOR_TYPE_CAT_BUYER'
        elif row[2] == 'VIP':
            VISITOR_TYPE_CAT = '@VISITOR_TYPE_CAT_VIP'
        elif row[2] == 'Exhibitor':
            VISITOR_TYPE_CAT = '@VISITOR_TYPE_CAT_EXHIBITOR'
        elif row[2] == 'Other Buyer':
            VISITOR_TYPE_CAT = '@VISITOR_TYPE_CAT_OTHER_BUYER'
        elif row[2] == 'Miscellaneous':
            VISITOR_TYPE_CAT = '@VISITOR_TYPE_CAT_MISCELLANEOUS'
        elif row[2] == 'ORS Form Template':
            VISITOR_TYPE_CAT = '@VISITOR_TYPE_CAT_ORS'

        sql_values = "VALUES ('" + row[0] + "', '" + row[1] + "'," + VISITOR_TYPE_CAT + ",@CREATED_BY, @LAST_UPDATED_BY)"
        return sql_values

    with open('visitor_type.csv') as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        with open('insertVisitorType.sql', "w") as visitorTypeSqlFile:
            line_count = 0
            for row in csv_reader:
                if line_count == 0:
                    # print(", ".join(row))
                    line_count += 1
                else:
                    # print(", ".join(row))
                    visitorTypeSqlFile.write(insert_sql_stat + " " + _get_sql_values(row) + ";\n")
                    line_count += 1
            print('Processed ' + str(line_count) + ' lines.')
            visitorTypeSqlFile.close()

if __name__ == '__main__':
    convert_visitor_type_csv_to_sql_insert_statement()


