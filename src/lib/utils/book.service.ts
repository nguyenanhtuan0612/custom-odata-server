import convertResults from '../utils/convertResults';
import connect from '../utils/connect';
var excel = require('exceljs');
export class BookService {
  async exportBookReportToExcel(req, res): Promise<any> {
    try {
      var workbook = new excel.Workbook(); //creating workbook
      var sheet = workbook.addWorksheet('Sản phẩm sách'); //creating worksheet

      var headers = [
        { header: 'Mã sách', key: 'Code', width: 10 }, // i need something like headerRow:2
        { header: 'Tên sách', key: 'Name', width: 30 }, // i need something like headerRow:2
        { header: 'Giá bìa', key: 'UnitPrice', width: 30 },
        { header: 'Số lượng', key: 'Quantity', width: 20 },
        { header: 'Số lượng đã bán', key: 'TotalSold', width: 30 },
      ];
      sheet.columns = headers;
      var data = await this.getBooks(
        req.body.filter,
        req.body.orderby,
        req.body.limit,
        null,
        'excel');

      sheet.addRows(data);
      // set style for each cell
      sheet.eachRow(function (Row, rowNum) {
        /** Row.alignment not work */
        // Row.alignment = { horizontal: 'left' }

        Row.eachCell(function (Cell) {
          /** cell.alignment not work */
          if (rowNum == 1) {
            Cell.alignment = {
              vertical: 'middle',
              horizontal: 'center'
            };
            Cell.font = {
              bold: true
            };
          } else {
            // if (cellNum == 7) {
            //   Cell.alignment = {
            //     wrapText: true,
            //     horizontal: 'center'
            //   };
            // } else {
            //   Cell.alignment = {
            //     wrapText: true
            //   };
            // }
          }
        })
      })

      workbook.xlsx.writeFile('./temp.xlsx').then(function () {
      });

      var tempfile = require('tempfile');
      var tempFilePath = tempfile('.xlsx');
      workbook.xlsx.writeFile(tempFilePath).then(function () {
        res.sendFile(tempFilePath, function () {
        });
      });
    }
    catch (err) {
      res.status(500).json(err);
    }
  }

 

  async getBooks(
    filter: string,
    orderby: string,
    limit: number,
    offset: number,
    type: string): Promise<any> {
    try {
      console.log(filter);
      console.log(orderby);
      if (orderby && orderby.length > 0) {
        orderby = `b."${orderby[0]['field']}" ${orderby[0]['direction']}`;
      } else {
        orderby = 'b."Id" desc';
      }

      const db = await connect();
      let query = `select distinct
                      b.*
                    from
                      "Books" b
                    left join "BookCategories" bc on
                      b."Id" = bc."BookId"
                      and (bc."IsDeleted" <> true
                      or bc."IsDeleted" is null)
                    left join "BookAuthors" ba on
                      b."Id" = ba."BookId"
                      and (ba."IsDeleted" <> true
                      or ba."IsDeleted" is null)
                    where
                      b."Visible" = true
                      and (b."IsDeleted" <> true
                      or b."IsDeleted" is null)`;
      var data = [];
      var nexDataIndex = 0;

      const conditions = [];
      if (filter['filters'] && filter['filters'].length > 0) {
        filter['filters'].forEach(element => {
          const field = element['field'];
          const search = element['search'];
          if (field === 'Name' || field === 'Code') {
            nexDataIndex++;
            data.push(search);
            conditions.push(`position($${nexDataIndex} in b."${field}") > 0`);
          } else if (field === "BookAuthors") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`ba."AuthorId" = ANY($${nexDataIndex}::int[])`);
          } else if (field === "BookCategories") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`bc."CategoryId" = ANY($${nexDataIndex}::int[])`);
          } else if (field === "PublicationDateMin") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`date(b."PublicationDate") >= date($${nexDataIndex})`);
          } else if (field === "PublicationDateMax") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`date(b."PublicationDate") <= date($${nexDataIndex})`);
          } else if (field === "UnitPriceMin") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`b."UnitPrice" >= $${nexDataIndex}`);
          } else if (field === "UnitPriceMax") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`b."UnitPrice" <= $${nexDataIndex}`);
          } else if (field === "TotalSoldMin") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`b."TotalSold" >= $${nexDataIndex}`);
          } else if (field === "TotalSoldMax") {
            nexDataIndex++;
            data.push(search);
            conditions.push(`b."TotalSold" <= $${nexDataIndex}`);
          }
        });
      }

      if (conditions.length > 0) {
        query += ` and ${conditions.join(' and ')}`
      }

      if (orderby) {
        query += ` ORDER BY ${orderby}`;
      }

      let queryCount = query.replace(`select distinct
      b.*
    from`, 'select count(*) from');

      if (type == 'excel' && limit && limit > 0) {
        nexDataIndex++;
        data.push(limit);
        query += ' LIMIT $' + nexDataIndex;
        var { rows } = await db.query(query, data);
        var queryData = convertResults(rows);
        return queryData;
      } else if (limit) {
        // paging
        nexDataIndex++;
        data.push(offset);
        query += ' OFFSET $' + nexDataIndex;

        nexDataIndex++;
        data.push(limit);
        query += ' LIMIT $' + nexDataIndex;

        var countDataFilter = data.slice(0);
        //remove limit data
        countDataFilter.pop();
        //remove offset data
        countDataFilter.pop();

        console.log(queryCount);
        console.log(countDataFilter);
        console.log(query);
        console.log(data);

        const countRes = await db.query(queryCount, countDataFilter);

        const { rows } = await db.query(query, data);
        const queryData = convertResults(rows);

        return {
          count: countRes.rows[0].count,
          value: queryData,
          next_offset: (offset + limit),
        };
      }
    } catch (error) {
      console.log(error);
    }
  }
}