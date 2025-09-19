sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"
], (Controller, JSONModel, Fragment, Filter, FilterOperator, MessageBox) => {
    "use strict";

    return Controller.extend("com.sap.coupang.zgrsummary.controller.GRSelectionScreen", {
        onInit() {
            var oDateRange = this.byId("GRdate");
            var oToday = new Date();
            var oStartOfMonth = new Date(oToday.getFullYear(), oToday.getMonth(), 1);
            oDateRange.setDateValue(oStartOfMonth);
            oDateRange.setSecondDateValue(oToday);

            var oViewModelSupplier = new sap.ui.model.json.JSONModel({
                selectedSupplierType: "layoutgeneral"
            });
            this.getView().setModel(oViewModelSupplier, "viewModelSupplier");
            setTimeout(() => {
                var oFilterSectionSupplier = this.byId("generalFilterSection");
                if (oFilterSectionSupplier) {
                    oFilterSectionSupplier.setVisible(true);
                }
            }, 0);
            var oviewModelMaterial = new sap.ui.model.json.JSONModel({
                selectedMaterialType: "layoutmatnum"
            });
            this.getView().setModel(oviewModelMaterial, "viewModelMaterial");
            setTimeout(() => {
                var oFilterSection = this.byId("matnumFilterSection");
                if (oFilterSection) {
                    oFilterSection.setVisible(true);
                }
            }, 0);
            var oAppModel = new JSONModel({
                "supplierCount": 0,
                "materialCount": 0
            });
            this.getView().setModel(oAppModel, "AppModel");
        },
        onExecute: function (oEvent) {
            var sPlantInput = this.byId("idFilterPlant")
            var sPlant = sPlantInput.getValue();
            if (!sPlant) {
                sPlantInput.setValueState("Error");
                sPlantInput.setValueStateText("Plant is required");
                return;
            } else {
                sPlantInput.setValueState("None");
            }
            var sCompanyCode = this.byId("idFilterCompanyCode").getValue();
            var sPlant = this.byId("idFilterPlant").getValue();
            var sSupplier = this.byId("idFilterSupplier").getValue();
            var sPoType = this.byId("idFilterPoTypes").getValue();
            var sPO = this.byId("idFilterPo").getValue();
            var sPurGroup = this.byId("idFilterPurGroup").getValue();
            var sMatGrp = this.byId("idFilterMaterialGroup").getValue();
            var sMat = this.byId("idFilterMaterial").getValue();
            var bIncludeCancellation = this.byId("idCancel").getSelected();

            var dPoDate = this.byId("PODate").getValue() === "" ? [] : this.byId("PODate").getValue().split("–");
            var dGRDate = this.byId("GRdate").getValue() === "" ? [] : this.byId("GRdate").getValue().split("–");

            var oFilterModel = new sap.ui.model.json.JSONModel({
                CompanyCode: sCompanyCode,
                Plant: sPlant,
                Supplier: sSupplier,
                PurchaseOrderType: sPoType,
                PurchaseOrder: sPO,
                PurchasingGroup: sPurGroup,
                MaterialGroup: sMatGrp,
                Material: sMat,
                POCreateDate: dPoDate,
                GoodReceiptDate: dGRDate,
                IncludeCancellation: bIncludeCancellation
            });

            localStorage.setItem("FilterState", JSON.stringify(oFilterModel.getData()));

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("GRDisplay");
        },
        onClear: function () {
            this.byId("idFilterCompanyCode").setValue("");
            this.byId("idFilterPlant").setValue("");
            this.byId("idFilterSupplier").setValue("");
            this.byId("idFilterPoTypes").setValue("");
            this.byId("idFilterPo").setValue("");
            this.byId("idFilterPurGroup").setValue("");
            this.byId("idFilterMaterialGroup").setValue("");
            this.byId("idFilterMaterial").setValue("");
            this.byId("PODate").setValue("");
            this.byId("GRdate").setValue("");
            this.byId("idCancel").setSelected(false);

            // var oTblModel = new JSONModel({ tblitems: []  });
            // this.getView().byId("displayGRTbl").setModel(oTblModel);

        },
        onCompanyCodeOpen: function (oEvent) {
            var oView = this.getView();
            var oDialog = this.byId("idCompanyCode");

            if (!oDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.CompanyCodeF4",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                // Clear previous filters before opening
                var oItemsBinding = oDialog.getBinding("items");
                if (oItemsBinding) {
                    oItemsBinding.filter([]); // Clear filters
                }
                oDialog.open();
            }
        },
        onSearchCompanyCode: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();

            var oFilter = new Filter({
                filters: [
                    new Filter("CompanyCode", FilterOperator.Contains, sValue),
                    new Filter("CompanyCodeName", FilterOperator.Contains, sValue)
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onCompanyCodeValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem"),
                oInput = this.byId("idFilterCompanyCode");
            oInput.setValue(oSelectedItem.getTitle());
        },
        onMaterialGrpOpen: function (oEvent) {
            var oView = this.getView();

            if (!this._oMaterialGroupDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.MaterialGroupF4",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    this._oMaterialGroupDialog = oDialog;
                    oDialog.open();
                }.bind(this));
            } else {
                this._oMaterialGroupDialog.open();
            }
        },
        onSearchMaterialGroup: function (oEvent) {
            var sValue = oEvent.getParameter("newValue");
            if (!sValue) {
                sValue = "";
            }
            sValue = sValue.trim().toUpperCase();

            var oTable = this.byId("materialGroupTable");
            var oBinding = oTable.getBinding("rows");

            var oFilter = new Filter({
                filters: [
                    new Filter("MATERIALGRP", FilterOperator.Contains, sValue),
                    new Filter("MaterialGrpDescription", FilterOperator.Contains, sValue),
                    new Filter("MaterialGrpDescription2", FilterOperator.Contains, sValue)
                ],
                and: false
            });

            oBinding.filter([oFilter]);
        },
        onMaterialGroupSelect: function (oEvent) {
            const oTable = this.byId("materialGroupTable");
            const iIndex = oEvent.getParameter("rowIndex");
            const oContext = oTable.getContextByIndex(iIndex);

            if (oContext) {
                const sMaterialGroup = oContext.getProperty("MATERIALGRP");
                this.byId("idFilterMaterialGroup").setValue(sMaterialGroup);
                this.byId("idMaterialGroup").close();
            }
        },
        onMaterialGroupValueHelpDialogClose: function () {
            this.byId("idMaterialGroup").close();
        },
        onPurGroupOpen: function (oEvent) {
            var oView = this.getView();
            var oDialog = this.byId("idPurchasingGroup");

            if (!oDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.PurchasingGroupF4",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                var oItemsBinding = oDialog.getBinding("items");
                if (oItemsBinding) {
                    oItemsBinding.filter([]);
                }
                var oSearchField = Fragment.byId(oView.getId(), "idSearchPurchasingGroup");
                if (oSearchField) {
                    oSearchField.setValue("");
                }
                oDialog.open();
            }
        },
        onSearchPurchasingGroup: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();



            var oFilter = new Filter({
                filters: [
                    new Filter("PurchasingGroup", FilterOperator.Contains, sValue),
                    new Filter("PurchasingGrpName", FilterOperator.Contains, sValue)
                ],
                and: false
            });


            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },

        onPurchasingGroupValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem"),
                oInput = this.byId("idFilterPurGroup");
            oInput.setValue(oSelectedItem.getTitle());
        },
        onPoTypesOpen: function (oEvent) {
            var oView = this.getView();
            var oDialog = this.byId("idPoType");

            if (!oDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.PoTypesOpenF4",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                var oItemsBinding = oDialog.getBinding("items");
                if (oItemsBinding) {
                    oItemsBinding.filter([]); 
                }
                var oSearchField = Fragment.byId(oView.getId(), "idSearchPoType");
                if (oSearchField) {
                    oSearchField.setValue("");
                }

                oDialog.open();
            }
        },
        onSearchPO: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();



            var oFilter = new Filter({
                filters: [
                    new Filter("POTYPE", FilterOperator.Contains, sValue),
                    new Filter("POTYPENAME", FilterOperator.Contains, sValue)
                ],
                and: false 
            });


            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },

        onPoTypeValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem"),
                oInput = this.byId("idFilterPoTypes");
            oInput.setValue(oSelectedItem.getTitle());
        },

        onPlantOpen: function (oEvent) {
    var oView = this.getView();
    var oDialog = this.byId("idPlant");

    if (!oDialog) {
        Fragment.load({
            id: oView.getId(),
            name: "com.sap.coupang.zgrsummary.view.fragments.PlantF4",
            controller: this
        }).then(function (oDialog) {
            oView.addDependent(oDialog);
            oDialog.open();
        });
    } else {
        var oItemsBinding = oDialog.getBinding("items");
        if (oItemsBinding) {
            oItemsBinding.filter([]);
        }

        var oSearchField = Fragment.byId(oView.getId(), "idSearchPlant");
        if (oSearchField) {
            oSearchField.setValue("");
        }

        oDialog.open();
    }
},
        onSearchPlant: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();

            if (sValue.length > 4) {
                var oFilter = new Filter({
                    filters: [
                        new Filter("PlantDescription", FilterOperator.Contains, sValue)
                    ],
                    and: false // Use OR logic
                });
            }
            else {

                var oFilter = new Filter({
                    filters: [
                        new Filter("Plant", FilterOperator.Contains, sValue),
                        new Filter("PlantDescription", FilterOperator.Contains, sValue)
                    ],
                    and: false // Use OR logic
                });
            }

            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },

        onPlantValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem"),
                oInput = this.byId("idFilterPlant");
            oInput.setValue(oSelectedItem.getTitle());
        },

        onSupplierTypeChange: function (oEvent) {
            var selectedKey = oEvent.getParameter("selectedItem").getKey();
            var oView = this.getView();
            var oViewModel = oView.getModel("viewModelSupplier");
            oViewModel.setProperty("/selectedSupplierType", selectedKey);

            var oGeneralSection = this.byId("generalFilterSection");
            var onCompanySection = this.byId("companyFilterSection");
            var oCountrySection = this.byId("countryFilterSection");
            var oRegionSection = this.byId("regionFilterSection");
            var oPernumSection = this.byId("pernumFilterSection");
            var onTaxSection = this.byId("taxFilterSection");
            var oAccGrpSection = this.byId("accGrpFilterSection");
            var oPurchaseSection = this.byId("purchasingFilterSection");

            if (oGeneralSection && onCompanySection && oCountrySection && oRegionSection && oPernumSection && onTaxSection && oAccGrpSection && oPurchaseSection) {
                oGeneralSection.setVisible(selectedKey === "layoutgeneral");
                onCompanySection.setVisible(selectedKey === "layoutcompanycode");
                oCountrySection.setVisible(selectedKey === "layoutcountry");
                oRegionSection.setVisible(selectedKey === "layoutregion");
                oPernumSection.setVisible(selectedKey === "layoutpernum");
                onTaxSection.setVisible(selectedKey === "layouttax");
                oAccGrpSection.setVisible(selectedKey === "layoutaccgrp");
                oPurchaseSection.setVisible(selectedKey === "layoutpurchasing");
            }
            const tableMap = {
                layoutgeneral: "idGeneralTable",
                layoutcompanycode: "idCompanyTable",
                layoutcountry: "idCountryTable",
                layoutregion: "idRegionTable",
                layoutpernum: "idPernumTable",
                layouttax: "idTaxTable",
                layoutaccgrp: "idAccGrpTable",
                layoutpurchasing: "idPurchasingTable"
            };

            Object.values(tableMap).forEach(tableId => {
                const oTable = oView.byId(tableId);
                if (oTable) {
                    oTable.setVisible(false);
                }
            });

        },
        onSupplierOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idSupplier")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.Supplier",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idSupplier").open();
            }

        },
        onSupplierValueHelpDialogClose: function () {
            var oViewModel = this.getView().getModel("viewModelSupplier");
            var selectedLayout = oViewModel.getProperty("/selectedSupplierType");

            var layoutIdMap = {
                "layoutgeneral": "generalFilterSection",
                "layoutcompanycode": "companyFilterSection",
                "layoutcountry": "countryFilterSection",
                "layoutregion": "regionFilterSection",
                "layoutpernum": "pernumFilterSection",
                "layouttax": "taxFilterSection",
                "layoutaccgrp": "accGrpFilterSection",
                "layoutpurchasing": "purchasingFilterSection"
            };

            var layoutId = layoutIdMap[selectedLayout];
            var oLayout = this.byId(layoutId);

            if (oLayout) {
                var aInputs = oLayout.findElements(true);
                aInputs.forEach(function (oControl) {
                    if (oControl.getMetadata().getName() === "sap.m.Input") {
                        oControl.setValue("");
                    }
                });
            }

            const tableIds = [
                "idGeneralTable",
                "idCompanyTable",
                "idCountryTable",
                "idRegionTable",
                "idPernumTable",
                "idTaxTable",
                "idAccGrpTable",
                "idPurchasingTable"
            ];
            tableIds.forEach(tableId => {
                const oTable = this.byId(tableId);
                if (oTable) {
                    oTable.setVisible(false);
                    oTable.setModel(null);
                }
            });

            const oDialog = this.byId("idSupplier");
            if (oDialog) {
                oDialog.close();
            }
        },

        onMaterialTypeChange: function (oEvent) {
            var selectedKey = oEvent.getParameter("selectedItem").getKey();
            var oView = this.getView();
            var oViewModel = oView.getModel("viewModelMaterial");
            oViewModel.setProperty("/selectedMaterialType", selectedKey);

            var sectionMap = {
                "layoutmatnum": "matnumFilterSection",
                "layoutoldmatnum": "oldmatnumFilterSection",
                "layoutmatgroup": "matgroupFilterSection",
                "layoutMatbyMatType": "TFilterSection",
            };
            for (var key in sectionMap) {
                var section = this.byId(sectionMap[key]);
                if (section) {
                    section.setVisible(false);
                }
            }
            var selectedSectionId = sectionMap[selectedKey];
            if (selectedSectionId) {
                var selectedSection = this.byId(selectedSectionId);
                if (selectedSection) {
                    selectedSection.setVisible(true);
                }
            }
            const tableMap = {
                layoutmatnum: "materialTableMatNum",
                layoutoldmatnum: "materialTableOldMatNum",
                layoutmatgroup: "materialTableMatGroup",
                layoutMatbyMatType: "materialTableMatType"
            };

            Object.values(tableMap).forEach(tableId => {
                const oTable = oView.byId(tableId);
                if (oTable) {
                    oTable.setVisible(false);
                }
            });
        },
        onMaterialOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idMainMaterial")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.MainMaterial",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idMainMaterial").open();
            }

        },
        onMainMaterialValueHelpDialogClose: function () {
            const oViewModel = this.getView().getModel("viewModelMaterial");
            const selectedLayout = oViewModel.getProperty("/selectedMaterialType");

            const layoutIdMap = {
                layoutmatnum: "matnumFilterSection",
                layoutoldmatnum: "oldmatnumFilterSection",
                layoutmatgroup: "matgroupFilterSection",
                layoutMatbyMatType: "TFilterSection"
            };

            const layoutId = layoutIdMap[selectedLayout];
            const oLayout = this.byId(layoutId);

            if (oLayout) {
                const aInputs = oLayout.findElements(true);
                aInputs.forEach(function (oControl) {
                    if (oControl.getMetadata().getName() === "sap.m.Input") {
                        oControl.setValue("");
                    }
                });
            }

            const tableIds = [
                "materialTableMatNum",
                "materialTableOldMatNum",
                "materialTableMatGroup",
                "materialTableMatType"
            ];
            tableIds.forEach(tableId => {
                const oTable = this.byId(tableId);
                if (oTable) {
                    oTable.setVisible(false);
                    oTable.setModel(null);
                }
            });

            const oDialog = this.byId("idMainMaterial");
            if (oDialog) {
                oDialog.close();
            } else {
                console.warn("Dialog 'idMainMaterial' not found.");
            }
        },
        onLanguageKeyOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idV4Languagekey")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.LanguageKey",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idV4Languagekey").open();
            }

        },
        onV4SearchLanguagekey: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("LanguageKey", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onV4LanguagekeyValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelMaterial");
            var selectedLayout = oViewModel.getProperty("/selectedMaterialType");
            var layoutToInputIdMap = {
                "layoutmatnum": "idlangKey",
                "layoutoldmatnum": "oidlangKey",
                "layoutMatbyMatType": "idTLangKey"
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onMatDescOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idV4MaterialCode")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.V4MaterialDesc",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idV4MaterialCode").open();
            }

        },
        onV4SearchMaterialCode: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("MaterialDescription", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onV4MaterialCodeValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelMaterial");
            var selectedLayout = oViewModel.getProperty("/selectedMaterialType");
            var layoutToInputIdMap = {
                "layoutmatnum": "idmatdesc",
                "layoutoldmatnum": "oidmatdesc",
                "layoutmatgroup": "idMatGroupDesc",
                "layoutMatbyMatType": "idTMatDesc"
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onV4MaterialOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idV4Material")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.V4Material",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idV4Material").open();
            }

        },
        onV4SearchV4Material: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("MaterialCode", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onV4MaterialValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelMaterial");
            var selectedLayout = oViewModel.getProperty("/selectedMaterialType");
            var layoutToInputIdMap = {
                "layoutmatnum": "idmat",
                "layoutoldmatnum": "oidmat",
                "layoutmatgroup": "idMatGroupMaterial",
                "layoutMatbyMatType": "idTMat"
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onMatGroupOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("MaterialGroup")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.MaterialGroup",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("MaterialGroup").open();
            }

        },
        onSearchMaterialGroup2: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("MATERIALGRP", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onMaterialGroup2ValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelMaterial");
            var selectedLayout = oViewModel.getProperty("/selectedMaterialType");
            var layoutToInputIdMap = {
                "layoutmatgroup": "idMatGroupL"
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onOldMatNumOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("OldMaterialNo")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.OldMaterialNo",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("OldMaterialNo").open();
            }

        },
        onSearchOldMaterialNo: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("MATERIALGRP", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onOldMaterialNoValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelMaterial");
            var selectedLayout = oViewModel.getProperty("/selectedMaterialType");
            var layoutToInputIdMap = {
                "layoutoldmatnum": "idOldMatNum"
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onTMatTypeOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("MaterialType")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.MaterialType",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("MaterialType").open();
            }

        },
        onSearchMaterialType: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("MATERIALGRP", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onMaterialTypeValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelMaterial");
            var selectedLayout = oViewModel.getProperty("/selectedMaterialType");
            var layoutToInputIdMap = {
                "layoutMatbyMatType": "idTMatType"
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onSearchMaterial: function () {
            const oViewModel = this.getView().getModel("viewModelMaterial");
            const selectedLayout = oViewModel.getProperty("/selectedMaterialType");

            const layoutInputMap = {
                layoutmatnum: {
                    Materialdescription: "idmatdesc",
                    LanguageKey: "idlangKey",
                    Material: "idmat"
                },
                layoutoldmatnum: {
                    oldmaterial: "idOldMatNum",
                    Materialdescription: "oidmatdesc",
                    LanguageKey: "oidlangKey",
                    Material: "oidmat"
                },
                layoutmatgroup: {
                    MaterialGroup: "idMatGroupL",
                    Materialdescription: "idMatGroupDesc",
                    Material: "idMatGroupMaterial"
                },
                layoutMatbyMatType: {
                    MaterialType: "idTMatType",
                    Materialdescription: "idTMatDesc",
                    LanguageKey: "idTLangKey",
                    Material: "idTMat"
                }
            };

            const inputIds = layoutInputMap[selectedLayout];
            const filters = [];

            if (inputIds) {
                const sMaterialdescription = this.byId(inputIds.Materialdescription)?.getValue().trim();
                const sLanguageKey = this.byId(inputIds.LanguageKey)?.getValue().trim();
                const sMaterial = this.byId(inputIds.Material)?.getValue().trim();
                const sMaterialGroup = this.byId(inputIds.MaterialGroup)?.getValue().trim();
                const sMaterialType = this.byId(inputIds.MaterialType)?.getValue().trim();
                const sOldMaterial = this.byId(inputIds.oldmaterial)?.getValue().trim();

                if (sMaterialdescription) filters.push(`MaterialDescription eq '${sMaterialdescription}'`);
                if (sLanguageKey) filters.push(`LanguageKey eq '${sLanguageKey}'`);
                if (sMaterial) filters.push(`MaterialCode eq '${sMaterial}'`);
                if (sMaterialGroup) filters.push(`MaterialGroup eq '${sMaterialGroup}'`);
                if (sMaterialType) filters.push(`MaterialType eq '${sMaterialType}'`);
                if (sOldMaterial) filters.push(`OldMaterialNumber eq '${sOldMaterial}'`);
            }

            const sFilterQuery = filters.length > 0 ? `$filter=${filters.join(" and ")}` : "";
            const oModel = this.getOwnerComponent().getModel("validationService");
            const sUrl = oModel.sServiceUrl + "ZMATERIALVH?$top=1000" + (sFilterQuery ? `&${sFilterQuery}` : "");

            $.ajax({
                type: "GET",
                url: sUrl,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    const oTblModel = new sap.ui.model.json.JSONModel({ materials: data.value });

                    // Table ID map
                    const tableMap = {
                        layoutmatnum: "materialTableMatNum",
                        layoutoldmatnum: "materialTableOldMatNum",
                        layoutmatgroup: "materialTableMatGroup",
                        layoutMatbyMatType: "materialTableMatType"
                    };

                    // Hide all tables and clear models
                    Object.values(tableMap).forEach(tableId => {
                        const oTable = this.byId(tableId);
                        if (oTable) {
                            oTable.setVisible(false);
                            oTable.setModel(null);
                        }
                    });

                    // Show and bind the selected table
                    const selectedTableId = tableMap[selectedLayout];
                    const oSelectedTable = this.byId(selectedTableId);
                    if (oSelectedTable) {
                        oSelectedTable.setModel(oTblModel);
                        oSelectedTable.setVisible(true);
                    }


                    this.getView().getModel("AppModel").setProperty("/materialCount", data.value.length);
                }.bind(this),
                error: function () {
                    MessageBox.error("Error fetching Material data from backend.");
                }
            });
        },
        onMaterialSelect: function (oEvent) {
            const oTable = oEvent.getSource();
            const iIndex = oEvent.getParameter("rowIndex");
            const oContext = oTable.getContextByIndex(iIndex);

            if (oContext) {
                const sMaterial = oContext.getProperty("MaterialCode");
                this.byId("idFilterMaterial").setValue(sMaterial);


                this.byId("idMainMaterial").close();
            }
        },
        onSearchTermOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idV4SearchTerm")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.SearchTerm",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idV4SearchTerm").open();
            }

        },
        onV4SearchSearchTerm: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onV4SearchTermValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelSupplier");
            var selectedLayout = oViewModel.getProperty("/selectedSupplierType");
            var layoutToInputIdMap = {
                "layoutgeneral": "idgenSearchTerm",
                "layoutcompanycode": "idcompSearchTerm",
                "layoutcountry": "idcountrySearchTerm",
                "layoutregion": "idregionSearchTerm",
                "layoutaccgrp": "idaccSearchTerm",
                "layoutpurchasing": "idpurSearchTerm"
            };
            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onCountryOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idV4Country")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.V4Country",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idV4Country").open();
            }
        },
        onV4SearchCountry: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("Country", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },

        onV4CountryValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelSupplier");
            var selectedLayout = oViewModel.getProperty("/selectedSupplierType");
            var layoutToInputIdMap = {
                "layoutgeneral": "idgencountryKey",
                "layoutcompanycode": "idcompCountry",
                "layoutcountry": "idcountryCountry",
                "layoutregion": "idregionCountry",
                "layouttax": "idtaxCountry",
                "layoutaccgrp": "idaccgrpCountry",
                "layoutpurchasing": "idpurchasingCountry"
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onNameOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idV4Name")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.V4Name",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idV4Name").open();
            }

        },
        onV4SearchName: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("VendorName", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onV4NameValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelSupplier");
            var selectedLayout = oViewModel.getProperty("/selectedSupplierType");
            var layoutToInputIdMap = {
                "layoutgeneral": "idgenname",
                "layoutcompanycode": "idcompname",
                "layoutcountry": "idcountryName",
                "layoutregion": "idregionName",
                "layoutpernum": "idpernumName",
                "layouttax": "idtaxName",
                "layoutaccgrp": "idaccName",
                "layoutpurchasing": "idpurName"
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onSupplierValueOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idV4Supplier")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.V4Supplier",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idV4Supplier").open();
            }

        },
        onV4SearchSupplier: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("Vendor", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onV4SupplierValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelSupplier");
            var selectedLayout = oViewModel.getProperty("/selectedSupplierType");
            var layoutToInputIdMap = {
                "layoutgeneral": "idgensupplierInput",
                "layoutcompanycode": "idcompSupplier",
                "layoutcountry": "idcountrySupplier",
                "layoutregion": "idregionSupplier",
                "layouttax": "idtaxSupplier",
                "layoutaccgrp": "idaccSupplier",
                "layoutpurchasing": "idpurSupplier"
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onSearchSupplier: function () {
            const oView = this.getView();
            const oViewModel = oView.getModel("viewModelSupplier");
            const selectedLayout = oViewModel.getProperty("/selectedSupplierType");

            const layoutInputMap = {
                layoutgeneral: {
                    tableId: "idGeneralTable",
                    searchterm: "idgenSearchTerm",
                    country: "idgencountryKey",
                    postal: "idgenpostalCode",
                    city: "idgencity",
                    name: "idgenname",
                    supplier: "idgensupplierInput",
                    deletionFlag: "idgendeletionFlag"
                },
                layoutcompanycode: {
                    tableId: "idCompanyTable",
                    searchterm: "idcompSearchTerm",
                    country: "idcompCountry",
                    postal: "idcompPostalcode",
                    city: "idcompCity",
                    name: "idcompname",
                    supplier: "idcompSupplier",
                    companycode: "idcompCompanycode",
                    deletionFlag: "idcompdeletionFlag"
                },
                layoutcountry: {
                    tableId: "idCountryTable",
                    country: "idcountryCountry",
                    city: "idcountryCity",
                    searchterm: "idcountrySearchTerm",
                    name: "idcountryName",
                    supplier: "idcountrySupplier",
                    companycode: "idcountryCompanyCode"
                },
                layoutregion: {
                    tableId: "idRegionTable",
                    country: "idregionCountry",
                    searchterm: "idregionSearchTerm",
                    name: "idregionName",
                    city: "idregionCity",
                    supplier: "idregionSupplier"
                },
                layoutpernum: {
                    tableId: "idPernumTable",
                    pernumber: "idpernumPerNum",
                    name: "idpernumName",
                    companycode: "idpernumCompanyCode"
                },
                layouttax: {
                    tableId: "idTaxTable",
                    tax1: "idtaxNum1",
                    tax2: "idtaxNum2",
                    tax3: "idtaxNum3",
                    tax4: "idtaxNum4",
                    tax5: "idtaxNum5",
                    tax6: "idtaxNum6",
                    regnumber: "idtaxCRegNum",
                    country: "idtaxCountry",
                    name: "idtaxName",
                    supplier: "idtaxSupplier"
                },
                layoutaccgrp: {
                    tableId: "idAccGrpTable",
                    accgroup: "idaccGroup",
                    searchterm: "idaccSearchTerm",
                    country: "idaccCountry",
                    postal: "idaccPostalcode",
                    city: "idaccCity",
                    name: "idaccName",
                    supplier: "idaccSupplier",
                    deletionFlag: "idaccDeletionFlag"
                },
                layoutpurchasing: {
                    tableId: "idPurchasingTable",
                    searchterm: "idpurSearchTerm",
                    country: "idpurchasingCountry",
                    postal: "idpurPostalCode",
                    city: "idpurCity",
                    name: "idpurName",
                    supplier: "idpurSupplier",
                    purorg: "idpurPurOrg",
                    settlement: "idpurSettlement",
                    deletionFlag: "idpurDeletionFlag"
                }
            };

            // Hide all tables
            Object.values(layoutInputMap).forEach(layout => {
                const oTable = oView.byId(layout.tableId);
                if (oTable) {
                    oTable.setVisible(false);
                }
            });

            // Get selected layout inputs
            const inputIds = layoutInputMap[selectedLayout];
            const filters = [];

            if (inputIds) {
                const sSupplier = this.byId(inputIds.supplier)?.getValue().trim();
                const sCountry = this.byId(inputIds.country)?.getValue().trim();
                const sPostal = this.byId(inputIds.postal)?.getValue().trim();
                const sCity = this.byId(inputIds.city)?.getValue().trim();
                const sName = this.byId(inputIds.name)?.getValue().trim();
                const bDeleted = this.byId(inputIds.deletionFlag)?.getValue().trim();

                if (sSupplier) filters.push(`Vendor eq '${sSupplier}'`);
                if (sCountry) filters.push(`Country eq '${sCountry}'`);
                if (sPostal) filters.push(`PostalCode eq '${sPostal}'`);
                if (sCity) filters.push(`City eq '${sCity}'`);
                if (sName) filters.push(`VendorName eq '${sName}'`);
                if (bDeleted) filters.push(`DeletionFlag eq true`);
            }

            const sFilterQuery = filters.length > 0 ? `$filter=${filters.join(" and ")}` : "";
            const oModel = this.getOwnerComponent().getModel("validationService");
            const sUrl = oModel.sServiceUrl + "ZFIXVENDORVH?$top=1000" + (sFilterQuery ? `&${sFilterQuery}` : "");
            $.ajax({
                type: "GET",
                url: sUrl,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    const oTblModel = new sap.ui.model.json.JSONModel({ suppliers: data.value });
                    const oTable = oView.byId(layoutInputMap[selectedLayout].tableId);
                    if (oTable) {
                        oTable.setModel(oTblModel);
                        oTable.setVisible(true);
                        const iLen = oTable.getBinding("rows").iLength;
                        oView.getModel("AppModel").setProperty("/supplierCount", iLen);
                    }
                }.bind(this),
                error: function () {
                    MessageBox.error("Error fetching supplier data from backend.");
                }
            });
        },
        onDeletionFlagOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idV4DeletionFlag")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.DeletionFlag",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idV4DeletionFlag").open();
            }

        },
        onV4SearchDeletionFlag: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onV4SDeletionFlagValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelSupplier");
            var selectedLayout = oViewModel.getProperty("/selectedSupplierType");
            var layoutToInputIdMap = {
                "layoutgeneral": "idgendeletionFlag",
                "layoutcompanycode": "idcompdeletionFlag",
                "layoutaccgrp": "idaccDeletionFlag",
                "layoutpurchasing": "idpurDeletionFlag"
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onCompanyOpen: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idV4CompanyCode")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.coupang.zgrsummary.view.fragments.V4CompanyCode",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idV4CompanyCode").open();
            }

        },
        onSearchV4CompanyCode: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            const oFilter = new Filter({
                filters: [
                    new Filter("CompanyCode", FilterOperator.Contains, sValue),
                ],
                and: false
            });
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onV4CompanyCodeValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var oViewModel = this.getView().getModel("viewModelSupplier");
            var selectedLayout = oViewModel.getProperty("/selectedSupplierType");
            var layoutToInputIdMap = {
                "layoutcompanycode": "idcompCompanycode",
                "layoutcountry": "idcountryCompanyCode",
                "layoutpernum": "idpernumCompanyCode",
            };

            var inputId = layoutToInputIdMap[selectedLayout];
            if (inputId) {
                var oInput = this.byId(inputId);
                if (oInput) {
                    oInput.setValue(oSelectedItem.getTitle());
                }
            }
        },
        onSupplierSelect: function (oEvent) {
            const oTable = oEvent.getSource();
            const iIndex = oEvent.getParameter("rowIndex");
            const oContext = oTable.getContextByIndex(iIndex);

            if (oContext) {
                const sSupplier = oContext.getProperty("Vendor");
                this.byId("idFilterSupplier").setValue(sSupplier);


                this.byId("idSupplier").close();
            }
        },

    });
});