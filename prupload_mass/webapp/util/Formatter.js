sap.ui.define([], function () {

     return {
          formatIconColor: function (status) {
               var result;
               if (status === "E") {
                    result = "red";
               }
               else {
                    result = "green";
               }
               return result;
          },
          formatDeliveryDate: function (del) {
               var result;
               const date = new Date();
                date.setDate(date.getDate() + 7)

               var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "yyyy-MM-dd" // You can change the pattern as needed
               });

               result = oDateFormat.format(date);

               return result;
          },
          formatRequisitionDate: function(dat){
               var result1;
               const date1 = new Date();
               var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "yyyy-MM-dd" 
               });

               result1 = oDateFormat.format(date1);
               return result1;
          }
     };
});
