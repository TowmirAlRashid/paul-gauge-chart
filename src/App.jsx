import { Box } from "@mui/material";
import { useEffect, useState } from "react";

import ChartCard from "./components/ChartCard";
import FetchingDataUI from "./components/FetchingDataUI";


const ZOHO = window.ZOHO;

function App() {
  const [initialized, setInitialized] = useState(false) // initialize the widget
  const [currentUser, setCurrentUser] = useState() // owner of the deals

  const [targetDeals, setTargetDeals] = useState([]) // keeps the target Deals

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
        let current_user = salesGoalResp?.users?.[0]?.id; // the current user id
        current_user = "2728756000000162861";   // fixed currently

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
  
        const dealsResp = await ZOHO.CRM.CONNECTION.invoke(conn_name, req_data) // target deals collected
        // console.log(dealsResp)
        setTargetDeals(dealsResp?.details?.statusMessage?.data)

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
      }
    }
    fetchData();
  }, [initialized])

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



  if(currentUser){
    return (
      <Box
        sx={{
          width: "100%",
          p: "1rem 1rem"
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem"
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
      </Box>
    );
  } else {
    return <FetchingDataUI /> // loader UI
  }
  
}

export default App;
