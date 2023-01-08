import { Box, Card, CardContent, Typography } from '@mui/material'
import React from 'react'

import GaugeChart from 'react-gauge-chart'

const chartStyle = {
    height: 100
}

const formatter = new Intl.NumberFormat('en-US', { // js formatter for currency
    style: 'currency',
    currency: 'USD',
});

const ChartCard = ({ labelOfChart, colors, target, arcsLength, label, targetToDate, percent, amount }) => {

  return (
    <Card sx={{ width: "100%", mb: "1rem" }}>
      <CardContent>
        <Typography sx={{
            fontWeight: "bold",
            fontSize: "1.2rem",
            mt: "1rem",
            mb: "0.7rem"
        }}>{labelOfChart}</Typography>

        <Box
            sx={{
                width: "70%",
                margin: "0 auto 1rem"
            }}
        >
            <GaugeChart 
                id={labelOfChart} 
                style={chartStyle} 
                colors={colors}
                percent={percent}
                textColor="black" 
                arcsLength={arcsLength}
                formatTextValue={(value) => {
                    value = ""
                    return value + ((Math.round(amount) / target) * 100).toFixed(2) + "%"
                }}
            />
        </Box>

        <Box
            sx={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                mt: "1rem"
            }}
        >
            <Box
                sx={{
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start"
                }}
            >
                <Typography>
                    {label}: <strong>{formatter.format(target)}</strong>
                </Typography>

                <Typography>
                    Target To Date: <strong>{formatter.format(targetToDate)}</strong>
                </Typography>
            </Box>
            <Box
                sx={{
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start"
                }}
            >
                <Typography>
                    Total Deal: <strong>{formatter.format(Math.round(amount))}</strong>
                </Typography>

                <Typography>
                    Target Filled Up: <strong>{((Math.round(amount) / target) * 100).toFixed(2)}</strong>%
                </Typography>
            </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ChartCard