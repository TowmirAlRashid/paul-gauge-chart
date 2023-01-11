import { Box, Button, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";

import ChartCard from "./components/ChartCard";
import FetchingDataUI from "./components/FetchingDataUI";


const ZOHO = window.ZOHO;

function App() {
  const [initialized, setInitialized] = useState(false) // initialize the widget
  const [currentUser, setCurrentUser] = useState() // owner of the deals

  const [targetDeals, setTargetDeals] = useState([]) // keeps the target Deals

  const [currentUserForTopDeals, setCurrentUserForTopDeals] = useState() // gets the current user to get his top 10 deals
  const [top10Deals, setTop10Deals] = useState([]) // holds the top 10 deals

  useEffect(() => { // initialize the app
    ZOHO.embeddedApp.on("PageLoad", function (data) { 
      setInitialized(true)
      // setEntity(data?.Entity)
      // setEntityId(data?.EntityId?.[0])
    });

    ZOHO.embeddedApp.init().then(() => {
      // sZOHO.CRM.UI.Resize({height: "600", width:"1300"});
    });
  }, [])

  const todayFormat = () => { //current day in "yyyy-mm-dd" format
    let date = new Date()
    let year = date.getFullYear()
    let month = date.getMonth()
    let days = date.getDate()
    return `${year}-${month + 1 < 10 ? `0${month + 1}` : month + 1}-${days < 10 ? `0${days}` : days}`;
  }

  const getCurrentMonth = () => { // get the current month in string value
    const date = new Date()

    switch(date.getMonth()){
      case 0: return 'Jan';
      case 1: return 'Feb';
      case 2: return 'Mar';
      case 3: return 'Apr';
      case 4: return 'May';
      case 5: return 'Jun';
      case 6: return 'Jul';
      case 7: return 'Aug';
      case 8: return 'Sep';
      case 9: return 'Oct';
      case 10: return 'Nov';
      default: return 'Dec'
    }
  }

  const currentDaysOfTheYear = ( now = new Date()) => { // get the count of days till now in this current year
    let start = new Date(now.getFullYear(), 0, 0);
    let diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    let oneDay = 1000 * 60 * 60 * 24;
    let day = Math.floor(diff / oneDay);
    return day;
  }


  useEffect(() => {
    const fetchData = async () => {
      if(initialized) {
        const salesGoalResp = await ZOHO.CRM.CONFIG.getCurrentUser() //get the record data for current sales goal
        let current_user_for_top10_deals = salesGoalResp?.users?.[0]?.id; // the current user id

        setCurrentUserForTopDeals(current_user_for_top10_deals) // gets the current user id for top 10 deals
        let current_user = "2728756000000162861";   // fixed currently

        const conn_name = "zoho_crm_conn";
        let req_data = {
          parameters: {
            select_query:
              `select id, Amount, Deal_Name, Decision_Date from Deals where ((Owner = '${current_user}' and Stage not in ('Deal Lost' , 'Lost Request')) and Decision_Date between '2023-01-01' and '${todayFormat()}') limit 0, 400 `,
          },
          method: "POST",
          url: "https://www.zohoapis.com/crm/v4/coql",
          param_type: 2,
        }
  
        const dealsForGaugeResp = await ZOHO.CRM.CONNECTION.invoke(conn_name, req_data) // target deals collected
        setTargetDeals(dealsForGaugeResp?.details?.statusMessage?.data)

        let req_data_goals = {
          parameters: {
            select_query:
              `select id, Annual, Apr, Aug, Dec, Feb, Jan, Jul, Jun, Mar, May, Nov, Oct, Sep from Sales_Goals where (Owner = '${current_user}')`,
          },
          method: "POST",
          url: "https://www.zohoapis.com/crm/v4/coql",
          param_type: 2,
        }

        const goalsResp = await ZOHO.CRM.CONNECTION.invoke(conn_name, req_data_goals) // target goals module values collected
        setCurrentUser(goalsResp?.details?.statusMessage?.data?.[0])


        let req_data_for_top10_deals = {
          parameters: {
            select_query:
              `select id, Amount, Deal_Name, Last_Follow_Up_Date, Days_From_Now from Deals where (Owner = '${currentUserForTopDeals}' and Stage not in ('Deal Completed', 'Deal Lost' , 'Lost Request')) ORDER BY Amount DESC limit 10`,
          },
          method: "POST",
          url: "https://www.zohoapis.com/crm/v4/coql",
          param_type: 2,
        }

        const topDealsResp = await ZOHO.CRM.CONNECTION.invoke(conn_name, req_data_for_top10_deals) // target deals collected for top 10 deals
        let finalDealsArray = topDealsResp?.details?.statusMessage?.data?.map((deal, index) => { // adds a custom property to the deals to show the rank of each deal
          return {
            ...deal,
            "rank": index + 1
          }
        })
        console.log(topDealsResp?.details?.statusMessage?.data)

        setTop10Deals(finalDealsArray)
      }
    }
    fetchData();
  }, [initialized, currentUserForTopDeals])

  const yearlyAmount = targetDeals.reduce((prevValue, currentData) => prevValue + currentData.Amount, 0) // gets the total deal amount of this year
  const yearlyTarget = currentUser?.Annual // gets the annual sales goal amount
  
  const yearlyDatewiseTarget = (currentDaysOfTheYearInNumber = currentDaysOfTheYear()) => {  // gets the dynamic target goal amount for days passed in this year till today
    let totalTarget = yearlyTarget;
    let currentYear = new Date().getFullYear()
    let totalDaysOfThisYear = ((currentYear % 4 === 0) && (currentYear % 100 !== 0)) || (currentYear % 400 === 0) ? 366 : 365

    let  currentTarget = (totalTarget / totalDaysOfThisYear) * currentDaysOfTheYearInNumber;

    return currentTarget / totalTarget;
  }


  const monthlyAmount = targetDeals.filter(deal => {  // the monthly deals amount in total
    return (new Date(deal.Decision_Date) >= new Date('2022-12-31') &&  new Date(deal.Decision_Date) <= new Date('2023-02-01'))
  }).reduce((prevValue, currentData) => prevValue + currentData.Amount, 0)
  const monthlyTarget = currentUser?.[getCurrentMonth()] // monthly sales goal target

  const monthlyDatewiseTarget = () => { // gets the dynamic target goal amount for days passed in this month till today
    let monthTarget = monthlyTarget;
    let currentMonth = new Date().getMonth()
    let totalDaysOfThisMonthInNumber = new Date(new Date().getFullYear(), currentMonth, 0).getDate()
    let cuurentDaysOfThisMonth = new Date().getDate()

    let currentTarget = (monthTarget / totalDaysOfThisMonthInNumber) * cuurentDaysOfThisMonth;

    return currentTarget / monthTarget;
  }

  const formatter = new Intl.NumberFormat('en-US', { // js formatter for currency
    style: 'currency',
    currency: 'USD',
  });

  const columns = [ // custom columns for the top 10 deals 
    { 
      field: 'rank', 
      headerName: 'Rank', 
      flex: 1
    },
    {
      field: 'Deal_Name',
      headerName: 'Deal name',
      renderCell: (params) => (
        <Box>
            <a 
              href={`https://crm.zoho.com/crm/org651752009/tab/Potentials/${params.row.id}`} // adds the deal id from the current row data to the custom link
              style={{ 
                color: "#1976d2",
                textDecoration: "none"
              }}
              target="_blank"
              rel="noreferrer"
              >
                {params.value}
            </a>
        </Box>
      ),
      flex: 4
    },
    {
      field: 'Amount',
      headerName: 'Amount',
      renderCell: (params) => (
        <Box
          sx={{backgroundColor: "#439454", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
            <Typography sx={{ fontSize: "small", color: "white" }}>
                {formatter.format(params.value)}
            </Typography>
        </Box>
      ),
      flex: 1.5
    },
    {
      field: 'Last_Follow_Up_Date',
      headerName: 'Last Contact Date',
      renderCell: (params) => (
        <Box>
            <Typography fontSize="small">
                {params.value === null ? "Needs Update" : params.value}
            </Typography>
        </Box>
      ),
      flex: 2
    },
    {
      field: 'Days_From_Now',
      headerName: 'Age',
      renderCell: (params) => (
        <Box>
            <Typography sx={{ color: `${params.value > 45 ? "red" : "black"}`, fontWeight: `${params.value > 45 ? "bold" : ""}` }} fontSize="small">
                {params.value}
            </Typography>
        </Box>
      ),
      flex: 1.5
    }
  ];



  if(top10Deals && currentUser){
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          p: "1rem 1rem"
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "15rem",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            mb: "2.5rem",
            mt: "1.5rem"
          }}
        >
          <Box
            sx={{
              width: "48%"
            }}
          >
            <ChartCard  // year to date chart
              labelOfChart="Year to Date"
              colors={["#FFC371", "#FF5F6D"]}
              target={yearlyTarget}
              arcsLength={[yearlyDatewiseTarget(), 1 - yearlyDatewiseTarget()]}
              label="Annual Target"
              targetToDate={yearlyTarget * yearlyDatewiseTarget()}
              percent={(yearlyAmount / yearlyTarget) > 1 ? 1 : (yearlyAmount / yearlyTarget)}
              amount={yearlyAmount}
            />
          </Box>
  
          <Box
            sx={{
              width: "48%",
            }}
          >
            <ChartCard  // month to date chart
              labelOfChart="Month to Date"
              colors={["#FFC371", "#FF5F6D"]}
              target={monthlyTarget}
              arcsLength={[monthlyDatewiseTarget(), 1 - monthlyDatewiseTarget()]}
              label="Monthly Target"
              targetToDate={monthlyTarget * monthlyDatewiseTarget()}
              percent={(monthlyAmount / monthlyTarget) > 1 ? 1 : (monthlyAmount / monthlyTarget)}
              amount={monthlyAmount}
            />
          </Box>
        </Box>

        <Box
          sx={{
            width: "100%",
            mb: "1rem",
            height: `calc(111px + ${10 * 30}px)` // changes the height according to the number of rows, default row height is 52px in MUI datagrid => top10Deals.length
          }}
        >
          <DataGrid
            rows={top10Deals}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            disableSelectionOnClick
            rowHeight={30}
          />
        </Box>

        <Box
          sx={{
            width: "100%",
            // mb: "1.5rem"
          }}
        >
          <Typography variant="h6" textAlign="center" mb={1}>Report Links</Typography>

          <Box
            sx={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "auto auto auto auto",
              padding: "1rem",
              gap: "1rem",
              ml: "1rem"
            }}
          >
            <Button href="" target="_blank" rel="noreferrer" variant="contained" sx={{ width: "8rem" }}>Link 1</Button>
            <Button href="" target="_blank" rel="noreferrer" variant="contained" sx={{ width: "8rem" }}>Link 2</Button>
            <Button href="" target="_blank" rel="noreferrer" variant="contained" sx={{ width: "8rem" }}>Link 3</Button>
            <Button href="" target="_blank" rel="noreferrer" variant="contained" sx={{ width: "8rem" }}>Link 4</Button>
          </Box>
        </Box>
      </Box>
    );
  } else {
    return <FetchingDataUI /> // loader UI
  }
  
}

export default App;
