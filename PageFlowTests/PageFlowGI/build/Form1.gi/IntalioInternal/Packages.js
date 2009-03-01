/*
 *  Copyright (C) 2008, Intalio Inc.
 *
 *  The program(s) herein may be used and/or copied only with the
 *  written permission of Intalio Inc. or in accordance with the terms
 *  and conditions stipulated in the agreement/contract under which the
 *  program(s) have been supplied.
 *
 * Date         Author             Changes
 * Apr 11, 2008   Mark Horton  Created
 */

/////////////////////////////////
// TaskManagementServices WSDL //
/////////////////////////////////
jsx3.lang.Package.definePackage(
  "Intalio.Internal.TMS",
  function(tms) {

    tms.TMS_NS = "xmlns:tms='http://www.intalio.com/BPMS/Workflow/TaskManagementServices-20051109/'";

    /////////////
    // getTask //
    /////////////
    tms.callGetTask = function() {
        var service = Intalio.Internal.Utilities.SERVER.
            loadResource("IntalioInternal_TaskManagementServicesMapping_xml");
        service.setOperationName("getTask");
        jsx3.log("tms.getTask request: " + Intalio.Internal.Utilities.tidy(service.getServiceMessage()));
      
        //subscribe
        service.subscribe(jsx3.net.Service.ON_SUCCESS, tms.onGetTaskSuccess);
        service.subscribe(jsx3.net.Service.ON_ERROR, tms.onGetTaskError);
        service.subscribe(jsx3.net.Service.ON_INVALID, tms.onGetTaskInvalid);

        //call the service
        service.doCall();
    };

    tms.onGetTaskSuccess = function(event) {
        var inDoc = event.target.getInboundDocument();
        jsx3.log("tms.getTask response: " + Intalio.Internal.Utilities.tidy(inDoc));
        
        var taskTypeNode = inDoc.selectSingleNode("//tms:taskType", tms.TMS_NS);
        if (taskTypeNode == null) {
            jsx3.log("tms.getTask error: no taskType node");
            return;
        }
        
        var taskType = taskTypeNode.getValue();        
        jsx3.log("tms.getTask taskType: " + taskType);        

        var taskStateNode = inDoc.selectSingleNode("//tms:taskState", tms.TMS_NS);
        var taskState = "NONE";
        
        if (taskStateNode != null) {    
            taskState = taskStateNode.getValue();            
        }       
        
        // set the taskState globally
        window.IntalioInternal_TaskState = taskState;
        
        jsx3.log("tms.getTask taskState: " + taskState);
        Intalio.Internal.Utilities.activateButtons(taskState);
        
        // get the data input node
        var mapNode = inDoc.selectSingleNode("//tms:output", tms.TMS_NS);
        if (mapNode == null) {
            mapNode = inDoc.selectSingleNode("//tms:input", tms.TMS_NS);
        }
        
        if (mapNode != null) {
            // create a doc from the node
            var mapDoc = new jsx3.xml.Document();
            mapDoc.loadXML(mapNode.getFirstChild());
            jsx3.log("tms.getTask inbound mapping node: " + Intalio.Internal.Utilities.tidy(mapDoc));
        
            // invoke the inbound mapping using the above doc
            var mapService = Intalio.Internal.Utilities.SERVER.
                loadResource(Intalio.Internal.Utilities.MAPPING);
            mapService.setInboundDocument(mapDoc);
            mapService.doInboundMap();        
            Intalio.Internal.Utilities.SERVER.getRootBlock().repaint();
        }
        
        jsx3.log("tms.getTask succeeded.");
        
        // not that fields are populated, check the form fields validations
        Intalio.Internal.Utilities.updateValidationStatus();
    };

    tms.onGetTaskError = function(event) {
        var status = event.target.getRequest().getStatus();
        jsx3.log("tms.getTask failed.  The HTTP Status code is: " + status);
    };

    tms.onGetTaskInvalid = function(event) {
        jsx3.log("tms.getTask failed.  The message failed validation.");
    };

    /////////////////
    // initProcess //
    /////////////////
    tms.callInitProcess = function() {
        // make sure the form is complete
        if (!Intalio.Internal.Utilities.validateForm()) return;

        // deactivate the buttons
        Intalio.Internal.Utilities.deactivateButtons();
        
        var service = Intalio.Internal.Utilities.SERVER.
            loadResource("IntalioInternal_TaskManagementServicesMapping_xml");
        service.setOperationName("initProcess");
        jsx3.log("tms.initProcess request: " + Intalio.Internal.Utilities.tidy(service.getServiceMessage()));
      
        //subscribe
        service.subscribe(jsx3.net.Service.ON_SUCCESS, tms.onInitProcessSuccess);
        service.subscribe(jsx3.net.Service.ON_ERROR, tms.onInitProcessError);
        service.subscribe(jsx3.net.Service.ON_INVALID, tms.onInitProcessInvalid);

        //call the service
        service.doCall();
    };

    tms.onInitProcessSuccess = function(event) {
        var inDoc = event.target.getInboundDocument();
        
        var nextId = "";
        var nextUrl = "";
        var nextIdNode = inDoc.selectSingleNode("//*[local-name()='nextTaskId']");
        if (nextIdNode != null) {
            nextId = nextIdNode.getValue();
            if (nextId == null) nextId = "";
            nextId = nextId.trim();            
        }
        
        var nextUrlNode = inDoc.selectSingleNode("//*[local-name()='nextTaskURL']");
        if (nextUrlNode != null) {
            nextUrl = nextUrlNode.getValue();
            if (nextUrl == null) nextUrl = "";
            nextUrl = nextUrl.trim();
        }

        if (nextId != "" && nextUrl != "") {
            var fullUrl = nextUrl + 
                "?id=" + nextId + 
                "&type=PATask" + 
                "&url=" + escape(nextUrl) +  
                "&token=" + Intalio.Internal.Utilities.getParticipantToken() + 
                "&user=" + escape(Intalio.Internal.Utilities.getUser());
                
            document.location.href = fullUrl;
        } else {
            document.getElementById("IntalioInternal_jsxmain").
                innerHTML = "<center>The process was successfully started.</center>";
        }  
        
        jsx3.log("tms.initProcess response: " + Intalio.Internal.Utilities.tidy(inDoc));            
        jsx3.log("tms.initProcess succeeded.");
    };

    tms.onInitProcessError = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);
        
        var status = event.target.getRequest().getStatus();
        jsx3.log("tms.initProcess failed. The HTTP Status code is: " + status);      
    };

    tms.onInitProcessInvalid = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);    
        
        jsx3.log("tms.initProcess failed.  The message failed validation.");
    };

    //////////////////////
    // setOutput (save) //
    //////////////////////
    tms.callSetOutput = function() {
        // deactivate the buttons
        Intalio.Internal.Utilities.deactivateButtons();
            
        var service = Intalio.Internal.Utilities.SERVER.
            loadResource("IntalioInternal_TaskManagementServicesMapping_xml");
        service.setOperationName("setOutput");
        jsx3.log("tms.setOutput request: " + Intalio.Internal.Utilities.tidy(service.getServiceMessage()));
      
        //subscribe
        service.subscribe(jsx3.net.Service.ON_SUCCESS, tms.onSetOutputSuccess);
        service.subscribe(jsx3.net.Service.ON_ERROR, tms.onSetOutputError);
        service.subscribe(jsx3.net.Service.ON_INVALID, tms.onSetOutputInvalid);

        //call the service
        service.doCall();
    };

    tms.onSetOutputSuccess = function(event) {
        document.getElementById("IntalioInternal_jsxmain").
            innerHTML = "<center>The process was successfully saved.</center>";
            
        var inDoc = event.target.getInboundDocument();
        jsx3.log("tms.setOutput response: " + Intalio.Internal.Utilities.tidy(inDoc));
        jsx3.log("tms.setOutput succeeded.");
    };

    tms.onSetOutputError = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);   
         
        var status = event.target.getRequest().getStatus();
        jsx3.log("tms.setOutput failed. The HTTP Status code is: " + status);      
    };

    tms.onSetOutputInvalid = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);
            
        jsx3.log("tms.setOutput failed.  The message failed validation.");
    };
    
    ////////////////////////
    // complete (dismiss) //
    ////////////////////////
    tms.callComplete = function() {
        // deactivate the buttons
        Intalio.Internal.Utilities.deactivateButtons();
            
        var service = Intalio.Internal.Utilities.SERVER.
            loadResource("IntalioInternal_TaskManagementServicesMapping_xml");
        service.setOperationName("complete");
        jsx3.log("tms.complete request: " + Intalio.Internal.Utilities.tidy(service.getServiceMessage()));
      
        //subscribe
        service.subscribe(jsx3.net.Service.ON_SUCCESS, tms.onCompleteSuccess);
        service.subscribe(jsx3.net.Service.ON_ERROR, tms.onCompleteError);
        service.subscribe(jsx3.net.Service.ON_INVALID, tms.onCompleteInvalid);

        //call the service
        service.doCall();
    };

    tms.onCompleteSuccess = function(event) {
        document.getElementById("IntalioInternal_jsxmain").
            innerHTML = "<center>The process was successfully dismissed.</center>";
            
        var inDoc = event.target.getInboundDocument();
        jsx3.log("tms.complete response: " + Intalio.Internal.Utilities.tidy(inDoc));            
        jsx3.log("tms.complete succeeded.");
    };

    tms.onCompleteError = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);
            
        var status = event.target.getRequest().getStatus();
        jsx3.log("tms.complete failed. The HTTP Status code is: " + status);      
    };

    tms.onCompleteInvalid = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);
            
        jsx3.log("tms.complete failed.  The message failed validation.");
    };    

    ////////////////////
    // getAttachments //
    ////////////////////
    tms.callGetAttachments = function() {
        var service = Intalio.Internal.Utilities.SERVER.
            loadResource("IntalioInternal_TaskManagementServicesMapping_xml");
        service.setOperationName("getAttachments");
        jsx3.log("tms.getAttachments request: " + Intalio.Internal.Utilities.tidy(service.getServiceMessage()));
      
        //subscribe
        service.subscribe(jsx3.net.Service.ON_SUCCESS, tms.onGetAttachmentsSuccess);
        service.subscribe(jsx3.net.Service.ON_ERROR, tms.onGetAttachmentsError);
        service.subscribe(jsx3.net.Service.ON_INVALID, tms.onGetAttachmentsInvalid);

        //call the service
        service.doCall();
    };

    tms.onGetAttachmentsSuccess = function(event) {
        var inDoc = event.target.getInboundDocument();
        jsx3.log("tms.getAttachments response: " + Intalio.Internal.Utilities.tidy(inDoc));            
        jsx3.log("tms.getAttachments succeeded.");
        
        // now show the attachments list
        Intalio.Internal.Attachments.showAttachments();
    };

    tms.onGetAttachmentsError = function(event) {
        var status = event.target.getRequest().getStatus();
        jsx3.log("tms.getAttachments failed. The HTTP Status code is: " + status);      
    };

    tms.onGetAttachmentsInvalid = function(event) {
        jsx3.log("tms.getAttachments failed.  The message failed validation.");
    };
    
    //////////////////////
    // removeAttachment //
    //////////////////////
    tms.callRemoveAttachment = function() {
        var service = Intalio.Internal.Utilities.SERVER.
            loadResource("IntalioInternal_TaskManagementServicesMapping_xml");
        service.setOperationName("removeAttachment");
        jsx3.log("tms.removeAttachment request: " + Intalio.Internal.Utilities.tidy(service.getServiceMessage()));
      
        //subscribe
        service.subscribe(jsx3.net.Service.ON_SUCCESS, tms.onRemoveAttachmentSuccess);
        service.subscribe(jsx3.net.Service.ON_ERROR, tms.onRemoveAttachmentError);
        service.subscribe(jsx3.net.Service.ON_INVALID, tms.onRemoveAttachmentInvalid);

        //call the service
        service.doCall();
    };

    tms.onRemoveAttachmentSuccess = function(event) {
        var inDoc = event.target.getInboundDocument();
        jsx3.log("tms.removeAttachment response: " + Intalio.Internal.Utilities.tidy(inDoc));            
        jsx3.log("tms.removeAttachment succeeded.");
        
        // refresh the attachments list from the ws
        tms.callGetAttachments();
    };

    tms.onRemoveAttachmentError = function(event) {
        var status = event.target.getRequest().getStatus();
        jsx3.log("tms.removeAttachment failed. The HTTP Status code is: " + status);      
    };

    tms.onRemoveAttachmentInvalid = function(event) {
        jsx3.log("tms.removeAttachment failed.  The message failed validation.");
    }; 
  }
);
// end package

/////////////////////////////
// TaskManagerProcess WSDL //
/////////////////////////////
jsx3.lang.Package.definePackage(
  "Intalio.Internal.TMP",
  function(tmp) {
    
    ///////////////
    // claimTask //
    ///////////////
    tmp.callClaimTask = function() {
        // deactivate the buttons
        Intalio.Internal.Utilities.deactivateButtons();
            
        var service = Intalio.Internal.Utilities.SERVER.
            loadResource("IntalioInternal_TaskManagerProcessMapping_xml");
        service.setOperationName("claimTask");
        jsx3.log("tmp.claimTask request: " + Intalio.Internal.Utilities.tidy(service.getServiceMessage()));
      
        //subscribe
        service.subscribe(jsx3.net.Service.ON_SUCCESS, tmp.onClaimTaskSuccess);
        service.subscribe(jsx3.net.Service.ON_ERROR, tmp.onClaimTaskError);
        service.subscribe(jsx3.net.Service.ON_INVALID, tmp.onClaimTaskInvalid);

        //call the service
        service.doCall();
    };

    tmp.onClaimTaskSuccess = function(event) {
        document.getElementById("IntalioInternal_jsxmain").
            innerHTML = "<center>The process was successfully claimed.</center>";
            
        var inDoc = event.target.getInboundDocument();
        jsx3.log("tmp.claimTask response: " + Intalio.Internal.Utilities.tidy(inDoc));            
        jsx3.log("tmp.claimTask succeeded.");
    };

    tmp.onClaimTaskError = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);
            
        var status = event.target.getRequest().getStatus();
        jsx3.log("tmp.claimTask failed. The HTTP Status code is: " + status);      
    };

    tmp.onClaimTaskInvalid = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);
            
        jsx3.log("tmp.claimTask failed.  The message failed validation.");
    };
    
    ////////////////
    // revokeTask //
    ////////////////
    tmp.callRevokeTask = function() {
        // deactivate the buttons
        Intalio.Internal.Utilities.deactivateButtons();
            
        var service = Intalio.Internal.Utilities.SERVER.
            loadResource("IntalioInternal_TaskManagerProcessMapping_xml");
        service.setOperationName("revokeTask");
        jsx3.log("tmp.revokeTask request: " + Intalio.Internal.Utilities.tidy(service.getServiceMessage()));
      
        //subscribe
        service.subscribe(jsx3.net.Service.ON_SUCCESS, tmp.onRevokeTaskSuccess);
        service.subscribe(jsx3.net.Service.ON_ERROR, tmp.onRevokeTaskError);
        service.subscribe(jsx3.net.Service.ON_INVALID, tmp.onRevokeTaskInvalid);

        //call the service
        service.doCall();
    };

    tmp.onRevokeTaskSuccess = function(event) {
        document.getElementById("IntalioInternal_jsxmain").
            innerHTML = "<center>The process was successfully revoked.</center>";
            
        var inDoc = event.target.getInboundDocument();
        jsx3.log("tmp.revokeTask response: " + Intalio.Internal.Utilities.tidy(inDoc));
        jsx3.log("tmp.revokeTask succeeded.");
    };

    tmp.onRevokeTaskError = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);
            
        var status = event.target.getRequest().getStatus();
        jsx3.log("tmp.revokeTask failed. The HTTP Status code is: " + status);      
    };

    tmp.onRevokeTaskInvalid = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);
            
        jsx3.log("tmp.revokeTask failed.  The message failed validation.");
    };  
    
    //////////////////
    // completeTask //
    //////////////////
    tmp.callCompleteTask = function() {
        if (!Intalio.Internal.Utilities.validateForm()) return;

        // deactivate the buttons
        Intalio.Internal.Utilities.deactivateButtons();
        
        var service = Intalio.Internal.Utilities.SERVER.
            loadResource("IntalioInternal_TaskManagerProcessMapping_xml");
        service.setOperationName("completeTask");
        jsx3.log("tmp.completeTask request: " + Intalio.Internal.Utilities.tidy(service.getServiceMessage()));
      
        //subscribe
        service.subscribe(jsx3.net.Service.ON_SUCCESS, tmp.onCompleteTaskSuccess);
        service.subscribe(jsx3.net.Service.ON_ERROR, tmp.onCompleteTaskError);
        service.subscribe(jsx3.net.Service.ON_INVALID, tmp.onCompleteTaskInvalid);

        //call the service
        service.doCall();
    };

    tmp.onCompleteTaskSuccess = function(event) {
        document.getElementById("IntalioInternal_jsxmain").
            innerHTML = "<center>The process was successfully completed.</center>";
            
        var inDoc = event.target.getInboundDocument();
        jsx3.log("tmp.completeTask response: " + Intalio.Internal.Utilities.tidy(inDoc));            
        jsx3.log("tmp.completeTask succeeded.");
    };

    tmp.onCompleteTaskError = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);
            
        var status = event.target.getRequest().getStatus();
        jsx3.log("tmp.completeTask failed. The HTTP Status code is: " + status);      
    };

    tmp.onCompleteTaskInvalid = function(event) {
        // re-activate the buttons
        Intalio.Internal.Utilities.activateButtons(window.IntalioInternal_TaskState);
            
        jsx3.log("tmp.completeTask failed.  The message failed validation.");
    };     
  }
);
// end package

////////////////////////////////
// TaskAttachmentService WSDL //
////////////////////////////////
jsx3.lang.Package.definePackage(
  "Intalio.Internal.TAS",
  function(tas) {
    
    ////////////
    // delete //
    ////////////
    tas.callDelete = function(attachmentUrl) {
        var service = Intalio.Internal.Utilities.SERVER.
            loadResource("IntalioInternal_TASMapping_xml");
        service.setOperationName("delete");
        jsx3.log("tas.delete request: " + Intalio.Internal.Utilities.tidy(service.getServiceMessage()));
      
        //subscribe
        service.subscribe(jsx3.net.Service.ON_SUCCESS, tas.onDeleteSuccess);
        service.subscribe(jsx3.net.Service.ON_ERROR, tas.onDeleteError);
        service.subscribe(jsx3.net.Service.ON_INVALID, tas.onDeleteInvalid);

        //call the service
        service.doCall();
    };

    tas.onDeleteSuccess = function(event) {
        var inDoc = event.target.getInboundDocument();
        jsx3.log("tas.delete response: " + Intalio.Internal.Utilities.tidy(inDoc));            
        jsx3.log("tas.delete succeeded.");
    };

    tas.onDeleteError = function(event) {
        var status = event.target.getRequest().getStatus();
        jsx3.log("tas.delete failed. The HTTP Status code is: " + status);      
    };

    tas.onDeleteInvalid = function(event) {
        jsx3.log("tas.delete failed.  The message failed validation.");
    };
  }
);
// end package

/////////////////
// Attachments //
/////////////////
jsx3.lang.Package.definePackage(
  "Intalio.Internal.Attachments",
  function(attach) {
  
    attach.showAttachments = function() {
        // the matrix is already populated, but we still need to calculate the proper block height
        var matrix = Intalio.Internal.Utilities.SERVER.getJSXByName("IntalioInternal_AttachmentsMatrix");
        if (matrix == null) return;
        
        var rows = matrix.getXML().getChildNodes().getLength();
        var rowHeight = matrix.getRowHeight(jsx3.gui.Matrix.DEFAULT_ROW_HEIGHT);
        var headerHeight = matrix.getHeaderHeight(jsx3.gui.Matrix.DEFAULT_HEADER_HEIGHT);        
        var height = (rows * rowHeight) + headerHeight;
        
        var extra = 70;
        if (document.IntalioInternal_AddAttachmentsForm.attachmentText.style.cssText == "") {
            extra = extra + 90;
        }
        
        attach.setAttachmentsMatrixBlockHeight(height);
        attach.setAttachmentsBlockHeight(height + extra);
        matrix.repaint();
    };
  
    attach.displayAttachmentsImageBlock = function(display) {
        var block = Intalio.Internal.Utilities.SERVER.getJSXByName("IntalioInternal_AttachmentsImageBlock");
        if (block == null) return;

        if (display) {
            block.setDisplay(jsx3.gui.Block.DISPLAYBLOCK, true);
        } else {
            block.setDisplay(jsx3.gui.Block.DISPLAYNONE, true);
        }
    };

/*
    attach.displayAttachmentsBlock = function(display) {
        var image = Intalio.Internal.Utilities.SERVER.getJSXByName("IntalioInternal_CloseImage");
        if (image == null) return;

        if (display) {
            image.setDisplay(jsx3.gui.Block.DISPLAYBLOCK, true);
            attach.populateAttachmentsForm();
        } else {
            image.setDisplay(jsx3.gui.Block.DISPLAYNONE, true);
            layout.setRows("21,0,*,65", true);
        }
        
        Intalio.Internal.Utilities.SERVER.getJSXByName("IntalioInternal_AttachmentsImageBlock").repaint();
    };
*/    
    attach.populateAttachmentsForm = function() {
        var label = Intalio.Internal.Utilities.SERVER.getJSXByName("IntalioInternal_AttachmentsFormLabel");
        if (label == null) return;

        // this is the html we want to display (its a form)
        var doc = Intalio.Internal.Utilities.SERVER.loadResource("IntalioInternal_AttachmentsForm_xml");
        if (doc == null) return;        
        
        var docRoot = doc.getRootNode();
        label.setText(docRoot, true);
        
        var form = document.IntalioInternal_AddAttachmentsForm;
        form.taskId.value = Intalio.Internal.Utilities.getTaskId();
        form.participantToken.value = Intalio.Internal.Utilities.getParticipantToken();
        form.authorizedUsers.value = Intalio.Internal.Utilities.getUser();
        form.attachmentText.value = "";
    };
    
    attach.setAttachmentsBlockHeight = function(height) {
        var block = Intalio.Internal.Utilities.SERVER.getJSXByName("IntalioInternal_AttachmentsBlock");
        block.setHeight(height, true);
    };

    attach.setAttachmentsMatrixBlockHeight = function(height) {
        var block = Intalio.Internal.Utilities.SERVER.getJSXByName("IntalioInternal_AttachmentsMatrixBlock");
        block.setHeight(height, true);
    };
    
    attach.addAttachment = function() {
        document.IntalioInternal_AddAttachmentsForm.submit();
        
        // clear out the attachment form fields
        document.IntalioInternal_AddAttachmentsForm.attachmentName.value = "";
        document.IntalioInternal_AddAttachmentsForm.attachmentFile.value = "";
        document.IntalioInternal_AddAttachmentsForm.attachmentText.value = "";
    }; 

    attach.removeAttachment = function(url) {
        var urlObj = Intalio.Internal.Utilities.SERVER.getJSXByName("IntalioInternal_AttachmentsUrl");
        if (urlObj == null) return;
        urlObj.setText(url);
        
        Intalio.Internal.TAS.callDelete();
        Intalio.Internal.TMS.callRemoveAttachment();
    }; 
    
    attach.updateCDFNode = function(context) {
        var url = context.getAttribute("IntalioInternal_PayloadUrl");
        var href = "<img src='/gi/files/images/remove.gif' border='0' " + 
                   "  onClick='Intalio.Internal.Attachments.removeAttachment(\"" + url + "\");' />"; 
        context.setAttribute("IntalioInternal_RemoveImage", href); 
        
        attach.setAttributeHref(url, context, "Title");
        attach.setAttributeHref(url, context, "MimeType");
        attach.setAttributeHref(url, context, "CreationDate");
    };
    
    attach.setAttributeHref = function(url, context, attr) {
        var fullAttr = "IntalioInternal_" + attr;
        var text = context.getAttribute(fullAttr);
        var href = "<a href='" + url + "' target='_blank' style='text-decoration: none; color: #581C90;'>" + text + "</a>";
        context.setAttribute(fullAttr, href);        
    };
    
    attach.displayTextInput = function() {
        var file = document.IntalioInternal_AddAttachmentsForm.attachmentFile;
        var text = document.IntalioInternal_AddAttachmentsForm.attachmentText;
        
        if (text.style.cssText == "") {
            text.style.cssText = "display: none;";
            file.style.cssText = "";
        } else {
            text.style.cssText = "";
            file.style.cssText = "display: none;";        
        }

        attach.showAttachments();        
    };
  }
);
// end package

///////////////
// Utilities //
///////////////
jsx3.lang.Package.definePackage(
  "Intalio.Internal.Utilities",
  function(util) {

    util.SERVER = Form1;
    util.MAPPING = "IntalioInternal_FormModelMapping_xml";
    
    // get a URL parameter 
    util.getRequestParameter = function(key) {
        var uri = new jsx3.net.URI(window.location.href);
        var val = uri.getQueryParam(key);
        return val;
    };    

    // get the task id
    util.getTaskId = function() {
        return util.getRequestParameter("id");
    };

    // get the participant token
    util.getParticipantToken = function() {
        return util.getRequestParameter("token");
    };

    // get the user
    util.getUser = function() {
        return util.getRequestParameter("user");
    };
    
    // get the type
    util.getType = function() {
        return util.getRequestParameter("type");
    };    
    
    // get the form url
    util.getFormUrl = function() {
        return util.getRequestParameter("url");
    };       

    util.appendOutboundFormModelNode = function(node) {
        var service = util.SERVER.loadResource(util.MAPPING);
        service.setOperationName("");
                
        var svcMsg = service.getServiceMessage();
        jsx3.log("Outbound mapping node: " + Intalio.Internal.Utilities.tidy(svcMsg));
        
        node.appendChild(svcMsg.cloneNode(true));
    };
    
    // displays buttons based on task type, but doesnt enable them
    util.processTaskType = function(taskType) {
        if (taskType == null) return;
      
        if (taskType == "PIPATask") {
            util.SERVER.getJSXByName("IntalioInternal_StartButton").
                setDisplay(jsx3.gui.Block.DISPLAYBLOCK, true);
        }
        else if (taskType == "PATask") {
            util.SERVER.getJSXByName("IntalioInternal_SaveButton").
                setDisplay(jsx3.gui.Block.DISPLAYBLOCK, true);
            util.SERVER.getJSXByName("IntalioInternal_ClaimButton").
                setDisplay(jsx3.gui.Block.DISPLAYBLOCK, true);
            util.SERVER.getJSXByName("IntalioInternal_RevokeButton").
                setDisplay(jsx3.gui.Block.DISPLAYBLOCK, true);
            util.SERVER.getJSXByName("IntalioInternal_CompleteButton").
                setDisplay(jsx3.gui.Block.DISPLAYBLOCK, true);
            
            // display the image block
            Intalio.Internal.Attachments.displayAttachmentsImageBlock(true);                
        }
        else if (taskType == "Notification") {
            util.SERVER.getJSXByName("IntalioInternal_DismissButton").
                setDisplay(jsx3.gui.Block.DISPLAYBLOCK, true);            
        }
    };
    
    util.activateButtons = function(taskState) {
        // this is for PIPA
        if (taskState == "NONE") {
            util.SERVER.getJSXByName("IntalioInternal_StartButton").setEnabled(true, true);
        }
        else if (taskState == "READY") {
            util.SERVER.getJSXByName("IntalioInternal_SaveButton").setEnabled(true, true);
            util.SERVER.getJSXByName("IntalioInternal_ClaimButton").setEnabled(true, true);
            util.SERVER.getJSXByName("IntalioInternal_CompleteButton").setEnabled(true, true);
            
            // this is really only needed on notifications
            util.SERVER.getJSXByName("IntalioInternal_DismissButton").setEnabled(true, true);            
        }
        else if (taskState == "CLAIMED") {
            util.SERVER.getJSXByName("IntalioInternal_SaveButton").setEnabled(true, true);
            util.SERVER.getJSXByName("IntalioInternal_RevokeButton").setEnabled(true, true);
            util.SERVER.getJSXByName("IntalioInternal_CompleteButton").setEnabled(true, true);
            
            // this is really only needed on notifications
            util.SERVER.getJSXByName("IntalioInternal_DismissButton").setEnabled(true, true);
        }        
    };
    
    util.deactivateButtons = function() {
        util.SERVER.getJSXByName("IntalioInternal_StartButton").setEnabled(false, true);
        util.SERVER.getJSXByName("IntalioInternal_SaveButton").setEnabled(false, true);
        util.SERVER.getJSXByName("IntalioInternal_ClaimButton").setEnabled(false, true);
        util.SERVER.getJSXByName("IntalioInternal_CompleteButton").setEnabled(false, true);            
        util.SERVER.getJSXByName("IntalioInternal_RevokeButton").setEnabled(false, true);
        util.SERVER.getJSXByName("IntalioInternal_DismissButton").setEnabled(false, true);
    };    
    
    // this is typically called only once, when a page first loads
    // this does not return a value or generate an alert
    util.updateValidationStatus = function() {
        var root = util.SERVER.getRootBlock();
        var children = root.getDescendantsOfType("jsx3.gui.Form", false);

        if (children != null) {        
            for (var i = 0; i < children.length; i++) {
                var element = children[i];
                
                // certain form elements do not implement the doValidate() method,
                // they will throw an exception
                try {
                    if (element.doValidate()) {
                        var image = util.getValidateImage(element);
                        if (image != null) {
                            image.setDisplay(jsx3.gui.Block.DISPLAYNONE, true);            
                        }
                    }
                } catch (Exception) {
                    // nothing to do    
                }
            }
        }    
    };
    
    // iterate over the form elements and validate them
    // returns true if all are valid, false otherwise (and an alert)
    util.validateForm = function() {
        var root = util.SERVER.getRootBlock();
        var children = root.getDescendantsOfType("jsx3.gui.Form", false);

        if (children != null) {        
            for (var i = 0; i < children.length; i++) {
                var element = children[i];
                
                // certain form elements do not implement the doValidate() method,
                // they will throw an exception
                try {
                    if (!element.doValidate()) {
                        var error = "The form is not completely filled out.";
                        
                        // try to get the image tooltip for the error message
                        var image = util.getValidateImage(element);
                        if (image != null) {
                            var tip = image.getTip();
                            
                            if (tip != null) {
                                tip = util.trim(tip);
                                
                                if (tip.length > 0) {
                                    error = tip;
                                }       
                            }
                        }
                        
                        alert(error);         
                        return false;
                    }
                } catch (Exception) {
                    // nothing to do    
                }
            }
        }
        
        return true;
    };
    
    // initialize the form
    util.initApp = function() {
        var taskType = util.getType();
        jsx3.log("task type = " + taskType);
        util.processTaskType(taskType);
        Intalio.Internal.TMS.callGetTask();
    };

    // set a color pickers value
    util.setColorPickerValue = function(colorPicker, value) {
        var valueObj = util.getValueObject(colorPicker);
        if (valueObj == null || value == null) return;
        
        var str = value.toString(16).toUpperCase();
        while (str.length < 6) {
            str = "0" + str;
        }
        
        var rgb = str.substring(0, 2) + " " + 
                  str.substring(2, 4) + " " + 
                  str.substring(4, 6);
        valueObj.setText(rgb, true);
    };
    
    // set a sliders value
    util.setSliderValue = function(slider, value) {        
        var valueObj = util.getValueObject(slider);
        if (valueObj == null || value == null) return;
        
        valueObj.setText(value.toFixed(2), true);
    };
    
    // check the validation of a form element
    util.validateElement = function(element) {
        var image = util.getValidateImage(element);
        if (image == null) return;

        // radio button group is always valid once selected         
        jsx3.require("jsx3.gui.RadioButton");
        if (element instanceof jsx3.gui.RadioButton) {
            image.setDisplay(jsx3.gui.Block.DISPLAYNONE, true);
            return;
        }
        
        if (element.doValidate()) {
            image.setDisplay(jsx3.gui.Block.DISPLAYNONE, true);
        }
        else {
            image.setDisplay(jsx3.gui.Block.DISPLAYBLOCK, true);
        }
    };
    
    // find an associated validation image, if any
    util.getValidateImage = function(element) {
        var name = util.getElementName(element);       
        if (name == null) return null;
        
        jsx3.require("jsx3.gui.RadioButton");
        if (element instanceof jsx3.gui.RadioButton) {
            name = element.getGroupName();
            if (name == null) return null;
        }
        
        var retval = util.SERVER.getJSXByName(name + "-validate");
        if (retval != null) {
            jsx3.require("jsx3.gui.Image");
            if (retval instanceof jsx3.gui.Image) {
                return retval;
            }
        }
        
        return null;                
    };
    
    // find an associated value object, if any
    util.getValueObject = function(element) {
        var name = util.getElementName(element);       
        if (name == null) return null;
        
        var retval = util.SERVER.getJSXByName(name + "-value");
        if (retval == null) {
            retval = util.SERVER.getJSXByName(name + "-value-nomap");
        }
        
        return retval;
    };

    // find the name of the given element    
    util.getElementName = function(element) {
        if (element == null) return null;
        
        var name = element.getName();        
        if (name == null) return null;
        
        // remove '-nomap' if it ends with it
        var idx = name.indexOf("-nomap");
        if (idx > 0) {
            if (idx == name.length - 6) {
                name = name.substring(0, idx);
            }
        }
        
        return name;        
    };
    
    // simple XSL to tidy up the network in/out XML, mostly for logging 
    util.tidy = function(xmlDoc) {
        if (xmlDoc == null) return "null";
        
        var strXSLCacheId = "IntalioInternal_Tidy_xsl";
        var strXSLURL = util.SERVER.resolveURI("IntalioInternal/Tidy.xsl");
        var objXSL = util.SERVER.getCache().getOrOpenDocument(strXSLURL, strXSLCacheId);
 
        var objTemplate = new jsx3.xml.Template(objXSL); 
        return "\n" + objTemplate.transformToObject(xmlDoc) + "\n";
    };
    
    util.trim = function(str, chars) {
        return util.ltrim(util.rtrim(str, chars), chars);
    };

    util.ltrim = function(str, chars) {
        chars = chars || "\\s";
        return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
    };

    util.rtrim = function(str, chars) {
        chars = chars || "\\s";
        return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
    };    
  }
);
// end package
