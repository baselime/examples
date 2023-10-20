
const mysql = require('mysql2')
const { trace } = require('@opentelemetry/api');
// if(!process.env.DATABASE_URL) {
//   console.warn('DATABASE_URL is not set')
//   process.exit(1);
// }
const connection = mysql.createConnection('mysql://jxqdczebk3ykyud1ck4n:pscale_pw_afAKw6UWaeiQTjkPSm3RZgCUiLK3xFnpCNGoB7Oy2OV@aws.connect.psdb.cloud/baselime?ssl={"rejectUnauthorized":true}');

connection.connect()

const tracer = trace.getTracer('mysql2-example');

(async() => {
    const result = await tracer.startActiveSpan('my-sql-example', (span) => {
        connection.query('SELECT 1', function (err, rows, fields) {
            console.log(err, rows, fields)
            
            connection.end();
            span.end();
            return rows;
        });
    })
    
    console.log(result)
})()
