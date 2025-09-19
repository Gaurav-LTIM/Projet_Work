sap.ui.loader.config({
    shim: {
        "com/sap/prupload/pruploadlatest/files/xlsx": {
            amd: true, // When being required, UI5 temporarily disables the global `define` to allow the third party lib register its global name to `globalThis` or `window`.
            exports: "XLSX", // Name of the global variable under which SheetJS exports its module value
        },
    }
});


sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "com/sap/prupload/pruploadlatest/files/xlsx",
    "sap/m/MessageBox"
], function (JSONModel, XLSX, MessageBox) {
    "use strict";

    const ExcelHandler = {


        // Entry Point Function to initiate the Upload and Validation Process
        _import: function (file, oValidateModel, sValidationServiceUrl, oAppModel, oValidatePayloadPrototype, oPayloadFieldMapping, nHearderRowNumber, nDataRowNumber, that) {

            that.localModel = new sap.ui.model.json.JSONModel();
            that.getView().setModel(that.localModel, "localModel");

            // to hold the extracted data from excel
            var excelData = {};

            if (file && window.FileReader) {
                var reader = new FileReader();
                // var that = this;
                reader.onload = function (e) {

                    var data = e.target.result;
                    var workbook = XLSX.read(data, { type: 'binary' });
                    var sheetName = workbook.SheetNames[0];
                    var worksheet = workbook.Sheets[sheetName];
                    excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (excelData) {

                        oValidateModel.setSizeLimit(10000);
                        var batchpayload = [];
                        var finalpayload = [];

                        // to hold excel header row data  
                        var headerRow = excelData[nHearderRowNumber - 1];

                        // to hold excel actual data
                        var dataRows = excelData.slice(nDataRowNumber - 1).filter(function (row) {
                            return Array.isArray(row) && row.some(cell => cell !== null && cell !== "" && String(cell).trim() !== "");
                        });


                        var arrayKey = null;
                        var aStaticKeys = [];

                        Object.keys(oValidatePayloadPrototype).forEach(function (key) {
                            if (!arrayKey && Array.isArray(oValidatePayloadPrototype[key]) && oValidatePayloadPrototype[key].length > 0) {
                                arrayKey = key;
                            } else {
                                aStaticKeys.push(key);
                            }
                        });

                        var oValidatePayloadArray = Object.keys(oValidatePayloadPrototype[arrayKey][0]);

                        // Payload creation as per the format required for the validation service 
                        var aPayload = ExcelHandler.createValidatePayLoad(headerRow, dataRows, oValidatePayloadArray, oPayloadFieldMapping, that);

                        // batch payload  creation
                        while (aPayload.length) {
                            batchpayload.push(aPayload.splice(0, 100));
                        }

                        for (var i = 0; i < batchpayload.length; i++) {
                            var result = {};

                            // Copy static keys from prototype
                            aStaticKeys.forEach(function (key) {
                                result[key] = oValidatePayloadPrototype[key];
                            });

                            // Add the batch array
                            result[arrayKey] = batchpayload[i];

                            finalpayload.push(result);
                        }

                        // Validating the created batch and binding to the view model
                        ExcelHandler.makeAjaxRequest(finalpayload, finalpayload[0]._Item.length, oValidateModel, sValidationServiceUrl, oAppModel, that);
                    }
                    // handeling empty excel data condition
                    else {

                        that.getView().byId("excelTable").setVisible(false);
                    }

                };
                reader.onerror = function (ex) {
                    console.log(ex);
                };
                reader.readAsBinaryString(file);
            }

        },

        // function for Payload creation as per the format required for the validation service
        createValidatePayLoad: function (headerRow, dataRows, oValidatePayloadArray, oPayloadFieldMapping, that) {
            var oGroupedData = {};

            // Create a mapping from header name to column index
            var fieldMapping = {};
            headerRow.forEach(function (headerName, index) {
                fieldMapping[headerName.trim()] = index;
            });

            // Process each row
            dataRows.forEach(function (row) {
                var prNumber = row[fieldMapping["PR number"]];
                if (!oGroupedData[prNumber]) {
                    oGroupedData[prNumber] = {
                        LineItems: []
                    };
                }

                var oLineItem = {};
                Object.keys(oPayloadFieldMapping).forEach(function (field) {
                    var excelHeader = oPayloadFieldMapping[field];
                    var columnIndex = fieldMapping[excelHeader];
                    var value = row[columnIndex] || "";

                    if (field === "QUANTITY") {
                        value = parseInt(value) || 0;
                    } else if (field === "DELIV_DATE") {
                        value = "20250625"; // You can replace this with actual logic
                    }

                    oLineItem[field] = value;
                });

                oGroupedData[prNumber].LineItems.push(oLineItem);
            });

            // Assign PRITEM_NO and PREQ_NO
            Object.keys(oGroupedData).forEach(function (prNumber) {
                var lineItems = oGroupedData[prNumber].LineItems;
                lineItems.forEach(function (item, index) {
                    item.PRITEM_NO = (index + 1) * 10;
                    item.PREQ_NO = prNumber;
                });
            });

            // Flatten all items
            var allItems = [];
            Object.keys(oGroupedData).forEach(function (prNumber) {
                allItems = allItems.concat(oGroupedData[prNumber].LineItems);
            });

            // Final payload construction
            var aPayload = allItems.map(function (item) {
                var mappedItem = {};
                oValidatePayloadArray.forEach(function (key) {
                    if (key === "PREQ_DATE" || key === "DELIV_DATE") {
                        mappedItem[key] = item[key] ? ExcelHandler.dateformat(item[key].toString()) : "";
                    } else {
                        mappedItem[key] = item[key] === undefined ? "" : item[key].toString();
                    }
                });

                return mappedItem;
            });

            return aPayload;
        },

        // function Validating the created batch and binding to the view model
        makeAjaxRequest: async function (requests, count, oValidateModel, sValidationServiceUrl, oAppModel, that) {
           
            var oData = [];
            const sUpdateGroupId = "createPrValidateGroup";
            var iTotalRequests = requests.length;
            var iCompletedRequests = 0;


            for (var i = 0; i < requests.length; i++) {
                that.getView().byId("idProg").setVisible(true);

                var oContext = oValidateModel.bindContext(sValidationServiceUrl, null, {
                    // $$updateGroupId: sUpdateGroupId
                });


                // Dynamically set all parameters
                Object.keys(requests[i]).forEach(function (key) {
                    oContext.setParameter(key, requests[i][key]);
                });

                try {
                    await oContext.execute().then(function (oAction) {
                        iCompletedRequests++;
                        const fProgress = (iCompletedRequests / iTotalRequests) * 100;
                        that.getView().byId("idProg").setDisplayValue("Validating " + Math.round(fProgress) + "%");
                        that.getView().byId("idProg").setPercentValue(Math.round(fProgress));
                        var oActionContext = oContext.getBoundContext();
                        var oResponse = oActionContext.getObject().value;
                        for (let i = 0; i < oResponse.length; i++) {
                            oData.push(oResponse[i]);
                            if (oResponse[i].STATUS === "E") {
                                that.getView().byId("createPR").setEnabled(false);
                            }
                        }


                        that.getView().setModel(new JSONModel(oData), "excelData");
                        oValidateModel.refresh();
                    });
                }
                catch (error) {
                    that.getView().byId("createPR").setEnabled(false);
                    MessageBox.error("Please enter valid excel data", {
                        onClose: function () {

                            that.file = null;
                            that.file_name = null;

                            // Reset file uploader control
                            var oFileUploader = that.getView().byId("fileUploaderId"); // Replace with actual ID
                            if (oFileUploader) {
                                oFileUploader.setValue(""); // or oFileUploader.clear() if supported
                            }

                            // Reset progress indicator
                            var oProgress = that.getView().byId("idProg");
                            if (oProgress) {
                                oProgress.setState("None");
                                oProgress.setDisplayValue("");
                                oProgress.setPercentValue(0);
                            }
                        }.bind(that) // Important: bind 'this' to access controller context
                    });

                    that.getView().byId("idProg").setState("Error");
                    that.getView().byId("idProg").setDisplayValue("Validation Failed...");
                }
                await oValidateModel.submitBatch(sUpdateGroupId);
                if (iTotalRequests === iCompletedRequests) {
                    var k = 0;
                    
                    oAppModel.setProperty("/countRecord", count);
                    for (var j = 0; j < oData.length; j++) {
                        if (oData[j].STATUS === "S") {
                            k++;
                        }
                    }
                    if (k === requests[0]._Item.length) {
                        that.getView().byId("createPR").setEnabled(true);
                    }
                    that.getView().byId("idProg").setState("Success");
                    that.getView().byId("idProg").setDisplayValue("Validation Completed");
                }
            }

        },


        // formatting data from the excel as per the validation payload's requirement
        dateformat: function (input) {

            if (!input) return "";

            const inputStr = String(input).trim();

            // Case 1: Handle "20250619" (yyyymmdd)
            if (/^\d{8}$/.test(inputStr)) {
                const year = inputStr.slice(0, 4);
                const month = inputStr.slice(4, 6);
                const day = inputStr.slice(6, 8);
                return `${year}-${month}-${day}`;
            }

            // Case 2: Handle "6/19/25" (Excel auto-converted date format)
            if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(inputStr)) {
                const parts = inputStr.split("/");
                const month = parseInt(parts[0]);
                const day = parseInt(parts[1]);
                const year = parseInt(parts[2]) + 2000; // assume 20xx
                if (
                    month >= 1 && month <= 12 &&
                    day >= 1 && day <= 31 &&
                    year >= 2000 && year <= 2099
                ) {
                    const mm = String(month).padStart(2, "0");
                    const dd = String(day).padStart(2, "0");
                    return `${year}-${mm}-${dd}`;
                }
            }
            return ""; // Invalid format
        },

        // function to download excel template
        onDownloadExcel: function (that, sFilePath, sDownloadFileName) {

            var sFile = sap.ui.require.toUrl(sFilePath);
            var oLink = document.createElement("a");
            oLink.href = sFile;
            oLink.download = sDownloadFileName;
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);
        }

    };

    return ExcelHandler;
});
