sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("com.sap.dashboard.db.idocdashboard.controller.Overview", {

        onInit: function () {

            var sImagePath = sap.ui.require.toUrl("com/sap/dashboard/db/idocdashboard/images/logo.png");
            this.getView().byId("companyLogo").setSrc(sImagePath);
            this.onReadIdocList();
            

        },

        onReadIdocList: function () {

            const oModel = this.getOwnerComponent().getModel();
            const that = this;

            //-----------  backend request directly for 1 month --------------------//
            // const today = new Date();
            // const oneMonthAgo = new Date();
            // oneMonthAgo.setMonth(today.getMonth() - 1);
            // oneMonthAgo.setHours(0, 0, 0, 0);
            // const isoDate = oneMonthAgo.toISOString().split('T')[0]; // e.g., "2025-08-01"
            // // const sUrl = oModel.sServiceUrl + `ZC_CDS_OUTBOUND_IDOC?$filter=CreatedAt ge ${isoDate}&$top=10000`;

            //-------------------------------------------------------------------------------------------------------//


            const sUrl = oModel.sServiceUrl + `ZC_CDS_OUTBOUND_IDOC?$top=10000`;

            $.ajax({
                type: "GET",
                url: sUrl,
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    const results = data.value || [];
                    sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(results), "FullIdocDataModel");

                    // setting data for daily and monthly pie chart
                    that.DailyandMonthlyIDOCSeperation(results);

                    // Weekly IDOC Data Model 
                    const weeklyModel = that.groupByTimeFrame(results, "weekly");
                    that.getView().setModel(weeklyModel, "weeklyChartModel");

                    // Hourly IDOC Data Model 
                    const hourlyModel = that.groupByTimeFrame(results, "hourly");
                    that.getView().setModel(hourlyModel, "hourlyChartModel");

                    const hourlyData = hourlyModel.getProperty("/ChartData");
                    if (!hourlyData || hourlyData.length === 0) {
                        hourlyModel.setData({
                            ChartData: [
                                { Label: "No Data", Status: "Success", Count: 0 },
                                { Label: "No Data", Status: "Failure", Count: 0 }
                            ]
                        });
                    }

                    const idocTypeGrouped = {};

                    results.forEach(item => {
                        const type = item.IDOCtype;
                        const status = item.IDOCStatus === "53" ? "Success" : "Failure";

                        if (!idocTypeGrouped[type]) {
                            idocTypeGrouped[type] = {
                                Success: { Count: 0, Items: [] },
                                Failure: { Count: 0, Items: [] }
                            };
                        }

                        idocTypeGrouped[type][status].Count++;
                        idocTypeGrouped[type][status].Items.push(item);
                    });

                    const idocTypeChartData = [];

                    Object.keys(idocTypeGrouped).forEach(type => {
                        ["Success", "Failure"].forEach(status => {
                            const group = idocTypeGrouped[type][status];
                            idocTypeChartData.push({
                                IDOCType: type,
                                Status: status,
                                Count: group.Count,
                                Items: group.Items
                            });
                        });
                    });

                    // Ensure known types are present even if count is 0
                    const knownIdocTypes = [
                        "ACC_DOCUMENT01",
                        "ACC_DOCUMENT05",
                        "FINSTA01",
                        "HRMD_A09",
                        "HRMD_ABA05"
                    ];

                    knownIdocTypes.forEach(type => {
                        if (!idocTypeGrouped[type]) {
                            ["Success", "Failure"].forEach(status => {
                                idocTypeChartData.push({
                                    IDOCType: type,
                                    Status: status,
                                    Count: 0,
                                    Items: []
                                });
                            });
                        }
                    });

                    that.getView().setModel(new sap.ui.model.json.JSONModel({ ChartData: idocTypeChartData }), "idocTypeChartModel");

                    const knownInterfaceTypes = [
                        "AFF", "CFG", "CGF", "CLG", "CMG", "EAT", "EY", "FI",
                        "GAP", "LAS", "MKR", "MM", "RG", "SIN"
                    ];

                    const interfaceTypeGrouped = {};

                    // Initialize structure
                    knownInterfaceTypes.forEach(type => {
                        interfaceTypeGrouped[type] = {
                            Success: { Count: 0, Items: [] },
                            Failure: { Count: 0, Items: [] }
                        };
                    });

                    // Group data
                    results.forEach(item => {
                        const type = (item.Mescode || "").trim();
                        const status = item.IDOCStatus === "53" ? "Success" : "Failure";

                        if (interfaceTypeGrouped[type]) {
                            interfaceTypeGrouped[type][status].Count++;
                            interfaceTypeGrouped[type][status].Items.push(item);
                        }
                    });

                    // Prepare chart data
                    const interfaceTypeChartData = [];

                    knownInterfaceTypes.forEach(type => {
                        ["Success", "Failure"].forEach(status => {
                            const group = interfaceTypeGrouped[type][status];
                            interfaceTypeChartData.push({
                                InterfaceType: type,
                                Status: status,
                                Count: group.Count,
                                Items: group.Items
                            });
                        });
                    });

                    // Set InterfaceType Data model
                    that.getView().setModel(new sap.ui.model.json.JSONModel({ ChartData: interfaceTypeChartData }), "interfaceTypeChartModel");

                },
                error: function () {
                    sap.m.MessageBox.error("Error fetching data from backend.");
                }
            });
        },

        DailyandMonthlyIDOCSeperation: function (results) {

            let aSuccessIdocMonthly = [];
            let aFailedIdocMonthly = [];
            let aSuccessIdocDaily = [];
            let aFailedIdocDaily = [];
            let successCountMonthly = 0;
            let failureCountMonthly = 0;
            let successCountDaily = 0;
            let failureCountDaily = 0;

            const today = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(today.getMonth() - 1);
            oneMonthAgo.setHours(0, 0, 0, 0);
            const isoDateOneMonthAgo = oneMonthAgo.toISOString().split('T')[0];

            results.forEach(item => {

                const sStatus = item.IDOCStatus === "53" ? "Success" : "Failure";
                const dToday = today.toISOString().split("T")[0]; // "YYYY-MM-DD

                if (item.CreatedAt >= isoDateOneMonthAgo) {
                    if (sStatus === "Success") {
                        successCountMonthly++;
                        aSuccessIdocMonthly.push(item);
                    }
                    else {
                        failureCountMonthly++;
                        aFailedIdocMonthly.push(item);
                    }
                }

                if (item.CreatedAt === dToday) {
                    if (sStatus === "Success") {
                        successCountDaily++;
                        aSuccessIdocDaily.push(item);
                    }
                    else {
                        failureCountDaily++;
                        aFailedIdocDaily.push(item);
                    }
                }

            });

            // Monthly IDOC Data Model
            sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(aSuccessIdocMonthly), "SuccessIdocDataModelMonthly");
            sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(aFailedIdocMonthly), "FailedIdocDataModelMonthly");
            this.getView().setModel(new sap.ui.model.json.JSONModel({
                ChartData: [
                    { Status: "Success", Count: successCountMonthly },
                    { Status: "Failure", Count: failureCountMonthly }
                ]
            }), "chartModelMonthly");

            if (successCountMonthly === 0 && failureCountMonthly === 0) {
                this.getView().setModel(new JSONModel({
                    ChartData: [
                        { Status: "Success", Count: 0 },
                        { Status: "Failure", Count: 0 }
                    ]
                }), "chartModelMonthly");
            }

            // Daily IDOC Data Model 
            sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(aSuccessIdocDaily), "SuccessIdocDataModelDaily");
            sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(aFailedIdocDaily), "FailedIdocDataModelDaily");
            this.getView().setModel(new sap.ui.model.json.JSONModel({
                ChartData: [
                    { Status: "Success", Count: successCountDaily },
                    { Status: "Failure", Count: failureCountDaily }
                ]
            }), "chartModelDaily");

            if (successCountDaily === 0 && failureCountDaily === 0) {
                this.getView().setModel(new JSONModel({
                    ChartData: [
                        { Status: "Success", Count: 0 },
                        { Status: "Failure", Count: 0 }
                    ]
                }), "chartModelDaily");
            }

        },

        // initial version-----------
        groupByTimeFrame: function (results, type) {
            const grouped = {};
            const today = new Date();
            const targetDate = today.toISOString().split("T")[0];
            const currentHour = today.getHours();

            results.forEach(item => {
                const status = item.IDOCStatus === "53" ? "Success" : "Failure";
                const date = new Date(item.CreatedAt + "T" + (item.Createtim || "00:00:00"));
                let label;

                switch (type) {
                    case "hourly":
                        if (item.CreatedAt === targetDate) {
                            const hour = date.getHours();
                            if (hour <= currentHour) {
                                label = `${targetDate} ${String(hour).padStart(2, "0")}:00`;
                            } else {
                                return;
                            }
                        } else {
                            return;
                        }
                        break;

                    case "weekly":
                        const day = date.getDay(); // 0 (Sun) to 6 (Sat)
                        const diffToMonday = day === 0 ? -6 : 1 - day;
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() + diffToMonday);
                        weekStart.setHours(0, 0, 0, 0);

                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);
                        weekEnd.setHours(23, 59, 59, 999);

                        label = `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`;
                        break;

                    default:
                        return;
                }

                if (!grouped[label]) {
                    grouped[label] = { Success: 0, Failure: 0 };
                }
                grouped[label][status]++;
            });

            const chartData = [];
            Object.keys(grouped).forEach(label => {
                chartData.push({ Label: label, Status: "Success", Count: grouped[label].Success });
                chartData.push({ Label: label, Status: "Failure", Count: grouped[label].Failure });
            });

            return new sap.ui.model.json.JSONModel({ ChartData: chartData });
        },

        onChartSelect: function (oEvent) {

            // debugger;
            const oSelectedData = oEvent.getParameter("data")[0].data;
            let sSelectedType;
            const selectedStatus = oSelectedData.Status || oSelectedData.status;
            let aSelectedItems;


            if (!oSelectedData || oSelectedData.length === 0) {
                sap.m.MessageToast.show("No data selected.");
                return;
            }

            if (!selectedStatus) {
                sap.m.MessageToast.show("Status not found in selected data.");
                return;
            }

            const chartId = oEvent.getSource().getId();
            let oModel, modelName;

            debugger
            // Determine model based on chart ID
            if (chartId.includes("Monthly")) {
                modelName = selectedStatus === "Success" ? "SuccessIdocDataModelMonthly" : "FailedIdocDataModelMonthly";
                oModel = sap.ui.getCore().getModel(modelName);
                aSelectedItems = oModel.getData();
            } else if (chartId.includes("Daily")) {
                modelName = selectedStatus === "Success" ? "SuccessIdocDataModelDaily" : "FailedIdocDataModelDaily";
                oModel = sap.ui.getCore().getModel(modelName);
                aSelectedItems = oModel.getData();
            } else if (chartId.includes("Weekly")) {
                modelName = "weeklyChartModel";
            } else if (chartId.includes("Hourly")) {
                modelName = "hourlyChartModel";
            } else if (chartId.includes("IdocType")) {
                oModel = this.getView().getModel("idocTypeChartModel");
                sSelectedType = oSelectedData["IDOC Type"];
                const chartData = oModel.getData().ChartData;
                const selectedGroup = chartData.find(entry =>
                    entry.IDOCType === sSelectedType && entry.Status === selectedStatus
                );

                aSelectedItems = selectedGroup ? selectedGroup.Items : [];
            } else if (chartId.includes("InterfaceType")) {
                sSelectedType = oSelectedData["InterfaceType"];
                oModel = this.getView().getModel("interfaceTypeChartModel");
                const chartData = oModel.getData().ChartData;
                const selectedGroup = chartData.find(entry =>
                    entry.InterfaceType === sSelectedType && entry.Status === selectedStatus
                );

                aSelectedItems = selectedGroup ? selectedGroup.Items : [];
            }


            const oFilteredModel = new sap.ui.model.json.JSONModel(aSelectedItems);
            sap.ui.getCore().setModel(oFilteredModel, "SelectedChartDataModel");

            localStorage.setItem("status", selectedStatus);
            localStorage.setItem("source", chartId);

            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Detailview");
        }

    });
});
