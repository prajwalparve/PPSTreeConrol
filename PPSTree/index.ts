import { strict } from "assert";
import {IInputs, IOutputs} from "./generated/ManifestTypes";

class ProductService{
    private _productServiceName: string;
    private _productServiceId: string;    
    private _isProduct: boolean;    
    private _childServices:  Array<ProductService> = [];
    

    public get productServiceName(): string {
        return this._productServiceName;
    }
    public set productServiceName(value: string) {
        this._productServiceName = value;
    }

    public get productServiceId(): string {
        return this._productServiceId;
    }
    public set productServiceId(value: string) {
        this._productServiceId = value;
    }

    public get isProduct(): boolean {
        return this._isProduct;
    }
    public set isProduct(value: boolean) {
        this._isProduct = value;
    }
    
    public get childServices(): Array<ProductService> {
        return this._childServices;
    }
    
}

class Program {
    private _programName: string;
    private _programID: string;
    private _productService: Array<ProductService> = [];

    constructor(){
        
    }

    public get programName(): string {
        return this._programName;
    }
    public set programName(value: string) {
        this._programName = value;
    }
    
    public get programID(): string {
        return this._programID;
    }
    public set programID(value: string) {
        this._programID = value;
    }

    public get productService(): Array<ProductService> {
        return this._productService;
    }
    


  }

export class PPSTree implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    /**
     * Empty constructor.
     */
    constructor()
    {

    }

    private _container: HTMLDivElement;
    private _text: HTMLTextAreaElement;
    private tree: HTMLDivElement;

    private _notifyOutputChanged: () => void;
    private _value: any;
    private _context: ComponentFramework.Context<IInputs>;

    //static entity names
    private _account = "account";
    private _program = "prep_program";
    private _programProductRleationshipName = "new_prep_program_product";
    private _productservice = "product";
    private _poductserviceelationshipName=  "cre04_product_product";




    //datafields
    //Account
    private _accountID : string;
    private _accountName : string;

    //program
    private _programs: Array<Program> = [];

    //
    private _associatedProductID: Array<string> = [];  


    private _associatedChildProductID: Array<string> = [];  

    
    


    

    

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public async init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement): Promise<void>
    {
        // Add control initialization code
        this._container = container;
        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;
        
        let accountID = (<any>context.mode).contextInfo.entityId;
        await this.getPrograms(accountID);

        for(let i=0; i<this._programs.length; i++){
               await this.getProductServices(this._programs[i]);
               for(let j = 0; j<this._programs[i].productService.length; j++){
                    if(this._programs[i].productService[j].isProduct)
                        await this.getProductChildServices(this._programs[i].productService[j]);
               }
        }        

        

        var data = "";

        for(let i = 0; i<this._programs.length; i++){

            data = data + "<li><details>";

            data = data +  "<summary>"+ this._programs[i].programName +" (Program) </summary> ";
            
            data  = data + "<ul>";

            for(let j=0; j<this._programs[i].productService.length; j++){


                    //data = data + "|------>" + this._programs[i].productService[j].productServiceName+'\r\n';
                    

                    if(this._programs[i].productService[j].isProduct)
                    {
                        data = data + "<li><details><summary>" + this._programs[i].productService[j].productServiceName+"</summary>";
                        data  = data + "<ul>";
                        for(let k=0;k<this._programs[i].productService[j].childServices.length;k++){
                           // data = data + "       "+"|------>" + this._programs[i].productService[j].childServices[k].productServiceName+'\r\n';
                            data = data + "<li>" + this._programs[i].productService[j].childServices[k].productServiceName +" (Service)</li>";
                        }  
                        data  = data + "</ul></details></li>";                 
                    }
                    else{
                        data = data + "<li>" + this._programs[i].productService[j].productServiceName +"</li>"; 
                    }
            }

            data  = data + "</ul>";
        
            data = data + "</details></li>";

        }

        


        var str = `
                        <ul class="tree">
                        `
                             +   data +
                            `
                        </ul>

       `

         this.tree =  document.createElement("div");
         this.tree.innerHTML = str;

        this._container.appendChild(this.tree);
        

    }

    public async getPrograms(accountID:string): Promise<void> {
        
        let fetchXML: string = "<fetch distinct='false' mapping='logical'>";
        fetchXML += "<entity name='" + this._program + "'>";
        fetchXML += "<attribute name='prep_programid' />";
        fetchXML += "<attribute name='prep_name' />";
        fetchXML += "<filter type='and'>";
        fetchXML += "<condition attribute='new_account' operator='eq' uiname='test' uitype='account' value='{"+accountID+"}' />";
        fetchXML += "</filter>";
        fetchXML += "</entity>";
        fetchXML += "</fetch>";

        var thisRef = this;
        
        // Invoke the Web API RetrieveMultipleRecords method to calculate the aggregate value
        await this._context.webAPI.retrieveMultipleRecords(this._program, "?fetchXml=" + fetchXML).then(
                function (response: ComponentFramework.WebApi.RetrieveMultipleResponse) {
                    // Retrieve multiple completed successfully -- retrieve the averageValue 
                    for( let i = 0; i < response.entities.length; i++){
                        const p = new Program();
                        p.programName = response.entities[i].prep_name;
                        p.programID = response.entities[i].prep_programid;
                        thisRef.addToProgramArray(p);
                    }
                   
                },
                function (errorResponse: any) {
                    // Error handling code here
                }
            );

            this._notifyOutputChanged();
   }

   public addToProgramArray(p:Program){
    this._programs.push(p);
   }

   public addToAssociateProductArray(p:string){
    this._associatedProductID.push(p);
   }

   public addToAssociateChildProductArray(p_id:string){
    this._associatedChildProductID.push(p_id);
   }

   

   public addToProgramProductArray(p:Program, ps:ProductService){

    p.productService.push(ps);

   }

   public addToProductChildServiceArray(s:ProductService,ps:ProductService){

    ps.childServices.push(s);

   }
   

   public async getProductServices(p:Program): Promise<void> {
        
            let fetchXML: string = "<fetch>";
            fetchXML += "<entity name='"+this._programProductRleationshipName+"'>";
            fetchXML += "<attribute name='prep_programid' />";
            fetchXML += "<attribute name='productid' />";
            fetchXML += "<filter>";
            fetchXML += "<condition attribute='prep_programid' operator='eq' value='"+p.programID+"' />";
            fetchXML += "</filter>";
            fetchXML += "</entity>";
            fetchXML += "</fetch>";


            var thisRef = this;

            
            
            await this._context.webAPI.retrieveMultipleRecords(this._programProductRleationshipName, "?fetchXml=" + fetchXML).then(
                    function (response: ComponentFramework.WebApi.RetrieveMultipleResponse) {
                        // Retrieve multiple completed successfully -- retrieve the averageValue 
                        for( let l = 0; l < response.entities.length; l++){
                            thisRef.addToAssociateProductArray(response.entities[l].productid);
                        }
                    
                    },
                    function (errorResponse: any) {
                        // Error handling code here
                        console.log(errorResponse);
                    }
                );

            if(this._associatedProductID.length){
            
                var  i=0;
                    for(;i<this._associatedProductID.length; i++){
                        

                        fetchXML = "<fetch>";
                        fetchXML += "<entity name='"+this._productservice+"'>";
                        fetchXML += "<attribute name='name' />";
                        fetchXML += "<attribute name='new_type' />";
                        fetchXML += "<filter type='and'>"+"<condition attribute='productid' operator='eq' value='"+this._associatedProductID[i]+"' />"+"</filter>";
                        fetchXML += "</entity>";
                        fetchXML += "</fetch>";
                    
                        await this._context.webAPI.retrieveMultipleRecords(this._productservice, "?fetchXml=" + fetchXML).then(
                                function (response: ComponentFramework.WebApi.RetrieveMultipleResponse) {
                                    // Retrieve multiple completed successfully -- retrieve the averageValue 
                                    for( let j = 0; j < response.entities.length; j++){

                                        const ps = new ProductService();
                                        ps.productServiceName = response.entities[j].name;
                                        ps.isProduct = (response.entities[j].new_type == "100000000") ? false : true;
                                        ps.productServiceId = response.entities[j].productid;


                                       thisRef.addToProgramProductArray(p,ps); 
                                        

                                        
                                    }
                                
                                },
                                function (errorResponse: any) {
                                    // Error handling code here
                                }
                            );

                    }

            
                this._associatedProductID = [];
    

        
            }

        this._notifyOutputChanged();
   }

   public async getProductChildServices(ps:ProductService): Promise<void> {
        
    let fetchXML: string = "<fetch>";
    fetchXML += "<entity name='"+this._poductserviceelationshipName+"'>";
    fetchXML += "<attribute name='productidone' />";
    fetchXML += "<attribute name='productidtwo' />";
    fetchXML += "<filter>";
    fetchXML += "<condition attribute='productidone' operator='eq' value='"+ps.productServiceId+"' />";
    fetchXML += "</filter>";
    fetchXML += "</entity>";
    fetchXML += "</fetch>";


    var thisRef = this;

    
    
    await this._context.webAPI.retrieveMultipleRecords(this._poductserviceelationshipName, "?fetchXml=" + fetchXML).then(
            function (response: ComponentFramework.WebApi.RetrieveMultipleResponse) {
                // Retrieve multiple completed successfully -- retrieve the averageValue 
                for( let l = 0; l < response.entities.length; l++){
                    thisRef.addToAssociateChildProductArray(response.entities[l].productidtwo);
                }
            
            },
            function (errorResponse: any) {
                // Error handling code here
                console.log(errorResponse);
            }
        );

    if(this._associatedChildProductID.length){
    
        var  i=0;
            for(;i<this._associatedChildProductID.length; i++){
                

                fetchXML = "<fetch>";
                fetchXML += "<entity name='"+this._productservice+"'>";
                fetchXML += "<attribute name='name' />";
                fetchXML += "<attribute name='new_type' />";
                fetchXML += "<filter type='and'>"+"<condition attribute='productid' operator='eq' value='"+this._associatedChildProductID[i]+"' />"+"</filter>";
                fetchXML += "</entity>";
                fetchXML += "</fetch>";
            
                await this._context.webAPI.retrieveMultipleRecords(this._productservice, "?fetchXml=" + fetchXML).then(
                        function (response: ComponentFramework.WebApi.RetrieveMultipleResponse) {
                            // Retrieve multiple completed successfully -- retrieve the averageValue 
                            for( let j = 0; j < response.entities.length; j++){

                                const s = new ProductService();
                                s.productServiceName = response.entities[j].name;
                                s.isProduct = (response.entities[j].name == "100000000") ? true : false;
                                s.productServiceId = response.entities[j].productid;
                                //ps.childServices.push(s); 
                                thisRef.addToProductChildServiceArray(s,ps);                              
                            }
                        
                        },
                        function (errorResponse: any) {
                            // Error handling code here
                        }
                    );

            }

    
        this._associatedChildProductID = [];



    }

this._notifyOutputChanged();
}



   


   


    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void
    {
        // Add code to update control view
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs
    {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void
    {
        // Add code to cleanup control if necessary
    }
}
