import { Box, CircularProgress, Typography } from '@mui/material'
import React from 'react'

const FetchingDataUI = () => {
  return (
    <Box
        sx={{
            width: "100%",
            height: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // position: "relative"
        }}
    >
         <Box
            sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                mt: "15rem"
            }}
         >
            <CircularProgress color="secondary" sx={{ mb: "1rem" }} />
            <Typography>
                Fetching data, Please wait some moments...
            </Typography>
         </Box>
    </Box>
  )
}

export default FetchingDataUI